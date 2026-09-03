"use client";

import { useEffect, useState } from "react";
import "./admin.css";

const ADMIN_EMAIL = "admin@markazul.athari.com";
const ADMIN_PASSWORD = "10044";

const emptySummary = {
	total: 0,
	male: 0,
	female: 0,
	kids: 0,
	inProgress: 0,
	completed: 0,
	fastestFinish: null,
};

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

export default function AdminPage() {
	const [authenticated, setAuthenticated] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loginError, setLoginError] = useState("");
	const [participants, setParticipants] = useState([]);
	const [summary, setSummary] = useState(emptySummary);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [activeView, setActiveView] = useState("leaderboard");

	const loadParticipants = async () => {
		setLoading(true);
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
			setLoading(false);
		}
	};

	useEffect(() => {
		if (!authenticated) {
			return;
		}

		loadParticipants();

		const refreshInterval = setInterval(() => {
			loadParticipants();
		}, 10000);

		return () => clearInterval(refreshInterval);
	}, [authenticated]);

	const handleLogin = (event) => {
		event.preventDefault();

		if (email.trim().toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
			setLoginError("Incorrect email or password.");
			return;
		}

		setLoginError("");
		setAuthenticated(true);
	};

	const handleSignOut = () => {
		setAuthenticated(false);
		setEmail("");
		setPassword("");
		setParticipants([]);
		setSummary(emptySummary);
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
		return (
			<main className="admin-login-page">
                <div className="admin-mark"><img src="./brand name.png" alt="AL MARKAZUL ATHARI" width="120" height="40" /></div>

				<section className="admin-login-card">
					<h1>Admin sign in</h1>
					<p className="admin-login-copy">Access the live quiz dashboard.</p>
					<form onSubmit={handleLogin} className="admin-login-form">
						<label htmlFor="admin-email">Email address</label>
						<input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required />
						<label htmlFor="admin-password">Password</label>
						<input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
						{loginError && <p className="admin-form-error">{loginError}</p>}
						<button type="submit" className="admin-primary-button">Sign in</button>
					</form>
				</section>
			</main>
		);
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
				<div className="admin-brand"><span className="admin-brand-mark">AM</span><span>Al Markazul Athari</span></div>
				<button className="admin-signout" onClick={handleSignOut}>Sign out</button>
			</header>

			<nav className="admin-tabs" aria-label="Admin sections">
				<button className={activeView === "questions" ? "admin-tab active" : "admin-tab"} onClick={() => setActiveView("questions")}>Questions</button>
				<button className={activeView === "leaderboard" ? "admin-tab active" : "admin-tab"} onClick={() => setActiveView("leaderboard")}>Leaderboard</button>
			</nav>

			<section className="admin-live-banner">
				<div className="live-copy"><span className="live-dot" /><div><strong>Quiz is LIVE</strong><span>Attendees can register and take the quiz now.</span></div></div>
				<div className="live-actions"><span className="started-pill">Started</span><button className="end-quiz-button" type="button">End quiz</button></div>
			</section>

			{activeView === "leaderboard" ? (
				<>
					<div className="admin-actions"><button onClick={loadParticipants} disabled={loading}>↻ Refresh</button></div>
					{error && <p className="admin-data-error">{error}</p>}
					<section className="admin-stats">{stats.map(([label, value]) => <article className="stat-card" key={label}><span>{label}</span><strong>{value}</strong></article>)}</section>
					<section className="participants-panel"><div className="panel-heading"><div><p className="admin-kicker">LIVE RESULTS</p><h2>Participant leaderboard</h2></div><span>{participants.length} records</span></div>
						<div className="table-wrap"><table><thead><tr><th>Name</th><th>Gender</th><th>Age</th><th>Status</th><th>Score</th><th>Started</th></tr></thead><tbody>{participants.map((participant) => <tr key={participant._id || participant.participantId}><td><strong>{participant.fullName}</strong><small>{participant.participantId}</small></td><td>{participant.gender}</td><td>{participant.age}</td><td><span className={`status-badge ${participant.status}`}>{participant.status === "completed" ? "Completed" : "In progress"}</span></td><td>{participant.status === "completed" ? `${participant.score}/${participant.totalQuestions}` : "--"}</td><td>{formatDate(participant.startedAt)}</td></tr>)}{!participants.length && <tr><td colSpan="6" className="empty-state">{loading ? "Loading participants..." : "No participants registered yet."}</td></tr>}</tbody></table></div>
					</section>
				</>
			) : <section className="placeholder-panel"><p className="admin-kicker">QUESTIONS</p><h2>Question management</h2><p>Question management can be added here when the quiz editor is ready.</p></section>}
		</main>
	);
}
