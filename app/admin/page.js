"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./admin.css";
import {
  clearAdminSession,
  getAdminSession,
} from "./session";
import Image from "next/image";

const QUIZ_STATUS_KEY = "al-markazul-quiz-status";

const emptySummary = {
	total: 0,
	male: 0,
	female: 0,
	kids: 0,
	inProgress: 0,
	completed: 0,
	fastestFinish: null,
};

const QUIZ_QUESTIONS = [
	{
		id: 1,
		question: "What is the capital city of India?",
		options: ["Mumbai", "New Delhi", "Kolkata", "Chennai"],
		answer: "New Delhi",
	},
	{
		id: 2,
		question: "Which planet is known as the Red Planet?",
		options: ["Earth", "Venus", "Mars", "Jupiter"],
		answer: "Mars",
	},
	{
		id: 3,
		question: "What does HTML stand for?",
		options: [
			"Hyper Text Markup Language",
			"High Text Machine Language",
			"Hyperlinks Text Mark Language",
			"Home Tool Markup Language",
		],
		answer: "Hyper Text Markup Language",
	},
	{
		id: 4,
		question: "Which language is primarily used to style web pages?",
		options: ["JavaScript", "Python", "CSS", "MongoDB"],
		answer: "CSS",
	},
	{
		id: 5,
		question: "Which database are you using for this quiz application?",
		options: ["MySQL", "MongoDB", "PostgreSQL", "SQLite"],
		answer: "MongoDB",
	},
];

function formatDuration(duration) {
	if (duration === null || duration === undefined) {
		return "--";
	}

	const seconds = Math.max(0, Math.round(duration / 1000));
	const minutes = Math.floor(seconds / 60);
	return `${minutes}m ${String(seconds % 60).padStart(2, "0")}s`;
}

function formatDate(date) {
	if (!date) {
		return "--";
	}

	return new Intl.DateTimeFormat("en", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(date));
}

function getTimeTaken(startedAt, completedAt) {
	if (!startedAt) {
		return "--";
	}

	const start = new Date(startedAt).getTime();
	const end = completedAt ? new Date(completedAt).getTime() : Date.now();
	const duration = Math.max(0, end - start);

	if (completedAt) {
		return formatDuration(duration);
	}

	return "In progress";
}

export default function AdminPage() {
	const router = useRouter();
	const [authenticated, setAuthenticated] = useState(false);
	const [participants, setParticipants] = useState([]);
	const [summary, setSummary] = useState(emptySummary);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [activeView, setActiveView] = useState("leaderboard");
	const [quizStarted, setQuizStarted] = useState(false);

	useEffect(() => {
		const session = getAdminSession();

		if (!session) {
			router.replace("/admin/login");
			return;
		}

		const started = localStorage.getItem(QUIZ_STATUS_KEY) === "true";
		setQuizStarted(started);
		setAuthenticated(true);
	}, [router]);

	const loadParticipants = async ({ silent = false } = {}) => {
		if (!silent) {
			setLoading(true);
		}
		setError("");

		try {
			const response = await fetch("/api/participants", {
				cache: "no-store",
			});
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "Failed to load participants.");
			}

			setParticipants(data.participants || []);
			setSummary(data.summary || emptySummary);
		} catch (requestError) {
			setError(requestError.message || "Failed to load participants.");
		} finally {
			if (!silent) {
				setLoading(false);
			}
		}
	};

	useEffect(() => {
		if (!authenticated || !quizStarted) {
			return;
		}

		loadParticipants({ silent: true });

		const refreshInterval = setInterval(() => {
			loadParticipants({ silent: true });
		}, 10000);

		return () => clearInterval(refreshInterval);
	}, [authenticated, quizStarted]);

	const handleStartQuiz = () => {
		const nextValue = !quizStarted;
		localStorage.setItem(QUIZ_STATUS_KEY, String(nextValue));
		setQuizStarted(nextValue);
	};

	const handleSignOut = () => {
		clearAdminSession();
		localStorage.removeItem(QUIZ_STATUS_KEY);
		setAuthenticated(false);
		setParticipants([]);
		setSummary(emptySummary);
		router.replace("/admin/login");
	};

	const exportCsv = () => {
		const headings = [
			"Participant ID",
			"Full Name",
			"Gender",
			"Age",
			"WhatsApp",
			"Status",
			"Score",
			"Total Questions",
			"Started At",
			"Completed At",
		];
		const rows = participants.map((participant) => [
			participant.participantId,
			participant.fullName,
			participant.gender,
			participant.age,
			participant.whatsapp,
			participant.status,
			participant.score,
			participant.totalQuestions,
			participant.startedAt,
			participant.completedAt || "",
		]);
		const csv = [headings, ...rows]
			.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
			.join("\n");
		const link = document.createElement("a");
		link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
		link.download = "al-markazul-participants.csv";
		link.click();
		URL.revokeObjectURL(link.href);
	};

	if (!authenticated) {
		return null;
	}

	const stats = [
		["Participants", summary.total],
		["Male", summary.male],
		["Female", summary.female],
		["Kids", summary.kids],
		["In progress", summary.inProgress],
		["Fastest finish", formatDuration(summary.fastestFinish)],
	];

	return (
		<main className="admin-page">
			<header className="admin-header">
                <div>
				<Image src="/logo.png" alt="logo" width="38" height="40" /><Image src="/brand name.png" alt="Al Markazul Athari" width="80" height="25" />
                </div>
				<button className="admin-signout" onClick={handleSignOut}>Sign out</button>
			</header>

			<nav className="admin-tabs" aria-label="Admin sections">
				<button className={activeView === "questions" ? "admin-tab active" : "admin-tab"} onClick={() => setActiveView("questions")}>Questions</button>
				<button className={activeView === "leaderboard" ? "admin-tab active" : "admin-tab"} onClick={() => setActiveView("leaderboard")}>Leaderboard</button>
			</nav>

			<section className="admin-live-banner">
				<div className="live-copy"><span className="live-dot" /><div><strong>{quizStarted ? "Quiz is LIVE" : "Quiz not started"}</strong><span>{quizStarted ? "Attendees can register and take the quiz now." : "Press Start to open the quiz for participants."}</span></div></div>
				<div className="live-actions">
					<button className="started-pill" type="button" onClick={handleStartQuiz}>
						{quizStarted ? "Started" : "Start"}
					</button>
					<button className="end-quiz-button" type="button" onClick={() => {
						localStorage.setItem(QUIZ_STATUS_KEY, "false");
						setQuizStarted(false);
					}}>
						End quiz
					</button>
				</div>
			</section>

			{activeView === "leaderboard" ? (
				<>
					<div className="admin-actions"><button onClick={loadParticipants} disabled={loading}>↻ Refresh</button></div>
					{error && <p className="admin-data-error">{error}</p>}
					<section className="admin-stats">{stats.map(([label, value]) => <article className="stat-card" key={label}><span>{label}</span><strong>{value}</strong></article>)}</section>
					<section className="participants-panel"><div className="panel-heading"><div><p className="admin-kicker">LIVE RESULTS</p><h2>Participant leaderboard</h2></div><span>{participants.length} records</span></div>
                        <div className="table-wrap"><table><thead><tr><th>Name</th><th>Gender</th><th>Age</th><th>Status</th><th>Score</th><th>Time Taken</th><th>Started</th></tr></thead><tbody>{participants.map((participant) => <tr key={participant._id || participant.participantId}><td><strong>{participant.fullName}</strong><small>{participant.participantId}</small></td><td>{participant.gender}</td><td>{participant.age}</td><td><span className={`status-badge ${participant.status}`}>{participant.status === "completed" ? "Completed" : "In progress"}</span></td><td>{participant.status === "completed" ? `${participant.score}/${participant.totalQuestions}` : "--"}</td><td>{getTimeTaken(participant.startedAt, participant.completedAt)}</td><td>{formatDate(participant.startedAt)}</td></tr>)}{!participants.length && <tr><td colSpan="7" className="empty-state">{loading ? "Loading participants..." : "No participants registered yet."}</td></tr>}</tbody></table></div>
					</section>
				</>
			) : (
				<section className="questions-panel">
					<div className="panel-heading">
						<div>
							<p className="admin-kicker">QUESTIONS</p>
							<h2>Quiz questions</h2>
						</div>
						<span>{QUIZ_QUESTIONS.length} questions</span>
					</div>

					<div className="questions-list">
						{QUIZ_QUESTIONS.map((item) => (
							<article key={item.id} className="question-item">
								<div className="question-header">
									<span className="question-number-badge">Q{item.id}</span>
									<strong>{item.question}</strong>
								</div>

								<ul className="question-options">
									{item.options.map((option) => (
										<li
											key={option}
											className={
												option === item.answer ? "correct-option" : ""
											}
										>
											{option}
										</li>
									))}
								</ul>
							</article>
						))}
					</div>
				</section>
			)}
		</main>
	);
}
