"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import "../globals.css";

const QUESTIONS = [
  {
    id: 1,
    question: "What is the capital city of India?",
    options: [
      "Mumbai",
      "New Delhi",
      "Kolkata",
      "Chennai",
    ],
    answer: "New Delhi",
  },
  {
    id: 2,
    question: "Which planet is known as the Red Planet?",
    options: [
      "Earth",
      "Venus",
      "Mars",
      "Jupiter",
    ],
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
    options: [
      "JavaScript",
      "Python",
      "CSS",
      "MongoDB",
    ],
    answer: "CSS",
  },
  {
    id: 5,
    question: "Which database are you using for this quiz application?",
    options: [
      "MySQL",
      "MongoDB",
      "PostgreSQL",
      "SQLite",
    ],
    answer: "MongoDB",
  },
];

const QUIZ_TIME = 1 * 60;

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <main className="quiz-loading">
          <div className="quiz-loader" />
          <p>Loading quiz...</p>
        </main>
      }
    >
      <QuizPageContent />
    </Suspense>
  );
}

function QuizPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const participantId = searchParams.get("participantId");

  const [participant, setParticipant] = useState(null);

  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [selectedAnswer, setSelectedAnswer] = useState("");

  const [answers, setAnswers] = useState({});

  const [score, setScore] = useState(0);

  const [timeLeft, setTimeLeft] = useState(QUIZ_TIME);

  const [submitting, setSubmitting] = useState(false);

  const [completed, setCompleted] = useState(false);

  const [error, setError] = useState("");

  // ==========================================
  // Load participant
  // ==========================================

  useEffect(() => {
    if (!participantId) {
      router.replace("/");
      return;
    }

    const savedParticipant =
      localStorage.getItem("quizParticipant");

    if (savedParticipant) {
      try {
        const parsed =
          JSON.parse(savedParticipant);

        if (
          parsed.participantId === participantId
        ) {
          setParticipant(parsed);
        }
      } catch (error) {
        console.error(
          "Invalid participant data",
          error
        );
      }
    }
  }, [participantId, router]);

  // ==========================================
  // Prevent leaving the quiz before completion
  // ==========================================

  useEffect(() => {
    if (!participant || completed || submitting) {
      return;
    }

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue =
        "would you like to quit the quiz";
      return event.returnValue;
    };

    const handlePopState = () => {
      const shouldQuit = window.confirm(
        "would you like to quit the quiz"
      );

      if (shouldQuit) {
        localStorage.removeItem(
          "quizParticipant"
        );
        router.replace("/");
        return;
      }

      window.history.pushState(
        null,
        "",
        window.location.href
      );
    };

    window.history.pushState(
      null,
      "",
      window.location.href
    );

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );
    window.addEventListener(
      "popstate",
      handlePopState
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );
      window.removeEventListener(
        "popstate",
        handlePopState
      );
    };
  }, [participant, completed, submitting, router]);

  // ==========================================
  // Countdown timer
  // ==========================================

  useEffect(() => {
    if (completed || submitting) {
      return;
    }

    if (timeLeft <= 0) {
      finishQuiz();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((previous) => previous - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, completed, submitting]);

  // ==========================================
  // Restore selected answer
  // ==========================================

  useEffect(() => {
    const savedAnswer =
      answers[currentQuestion];

    setSelectedAnswer(savedAnswer || "");
  }, [currentQuestion, answers]);

  // ==========================================
  // Select answer
  // ==========================================

  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);

    setAnswers((previous) => ({
      ...previous,
      [currentQuestion]: answer,
    }));
  };

  // ==========================================
  // Next question
  // ==========================================

  const handleNext = () => {
    if (!selectedAnswer) {
      setError("Please select an answer.");
      return;
    }

    setError("");

    if (
      currentQuestion <
      QUESTIONS.length - 1
    ) {
      setCurrentQuestion(
        (previous) => previous + 1
      );
    } else {
      finishQuiz();
    }
  };

  // ==========================================
  // Previous question
  // ==========================================

  const handlePrevious = () => {
    setError("");

    if (currentQuestion > 0) {
      setCurrentQuestion(
        (previous) => previous - 1
      );
    }
  };

  // ==========================================
  // Calculate score
  // ==========================================

  const calculateScore = () => {
    let finalScore = 0;

    QUESTIONS.forEach(
      (question, index) => {
        if (
          answers[index] ===
          question.answer
        ) {
          finalScore++;
        }
      }
    );

    // Include currently selected answer
    const lastAnswer = selectedAnswer;

    if (
      currentQuestion ===
      QUESTIONS.length - 1
    ) {
      if (
        lastAnswer &&
        lastAnswer ===
          QUESTIONS[currentQuestion].answer &&
        answers[currentQuestion] !==
          lastAnswer
      ) {
        finalScore++;
      }
    }

    return finalScore;
  };

  // ==========================================
  // Finish quiz
  // ==========================================

  const finishQuiz = async () => {
    if (submitting || completed) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const finalAnswers = {
        ...answers,
        [currentQuestion]: selectedAnswer,
      };

      let finalScore = 0;

      QUESTIONS.forEach(
        (question, index) => {
          if (
            finalAnswers[index] ===
            question.answer
          ) {
            finalScore++;
          }
        }
      );

      setScore(finalScore);

      const response = await fetch(
        "/api/participants",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            participantId,
            score: finalScore,
            totalQuestions:
              QUESTIONS.length,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to submit quiz."
        );
      }

      // Update local storage
      const savedParticipant =
        localStorage.getItem(
          "quizParticipant"
        );

      if (savedParticipant) {
        const updatedParticipant =
          JSON.parse(savedParticipant);

        updatedParticipant.status =
          "completed";

        updatedParticipant.score =
          finalScore;

        updatedParticipant.totalQuestions =
          QUESTIONS.length;

        updatedParticipant.completedAt =
          new Date().toISOString();

        localStorage.setItem(
          "quizParticipant",
          JSON.stringify(
            updatedParticipant
          )
        );
      }

      setCompleted(true);
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "Unable to submit your quiz."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // Format time
  // ==========================================

  const formatTime = (seconds) => {
    const minutes = Math.floor(
      seconds / 60
    );

    const remainingSeconds =
      seconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  // ==========================================
  // Loading
  // ==========================================

  if (!participant && !completed) {
    return (
      <main className="quiz-loading">
        <div className="quiz-loader" />
        <p>Loading quiz...</p>
      </main>
    );
  }

  // ==========================================
  // Completed
  // ==========================================

  if (completed) {
    const percentage = Math.round(
      (score / QUESTIONS.length) *
        100
    );

    return (
      <main className="quiz-completed">
        <div className="result-card">

          <div className="success-icon">
            ✓
          </div>

          <p className="result-eyebrow">
            QUIZ COMPLETED
          </p>

          <h1>
            Well done
            {participant?.fullName
              ? `, ${participant.fullName}`
              : ""}
            !
          </h1>

          <p className="result-description">
            Your quiz has been successfully
            submitted.
          </p>

          <div className="score-box">
            <span>Your Score</span>

            <strong>
              {score}
              <small>
                /{QUESTIONS.length}
              </small>
            </strong>

            <p>
              {percentage}% correct
            </p>
          </div>

          <p className="result-message">
            Thank you for participating.
          </p>

        </div>
      </main>
    );
  }

  const question =
    QUESTIONS[currentQuestion];

  const progress =
    ((currentQuestion + 1) /
      QUESTIONS.length) *
    100;

  return (
    <main className="quiz-page">

      {/* ================================= */}
      {/* Header */}
      {/* ================================= */}

      <header className="quiz-header">

        <div className="quiz-brand">
        <div>
                <Image src="/logo.png" alt="logo" width="38" height="40" /><Image src="/brand name.png" alt="Al Markazul Athari" width="80" height="25" />
        </div>

          {participant && (
            <p>
              {participant.fullName}
            </p>
          )}
        </div>

        <div className="timer">
          <span>Time Left</span>

          <strong>
            {formatTime(timeLeft)}
          </strong>
        </div>

      </header>

      {/* ================================= */}
      {/* Progress */}
      {/* ================================= */}

      <div className="progress-container">

        <div className="progress-info">
          <span>
            Question{" "}
            {currentQuestion + 1} of{" "}
            {QUESTIONS.length}
          </span>

          <span>
            {Math.round(progress)}%
          </span>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

      </div>

      {/* ================================= */}
      {/* Question */}
      {/* ================================= */}

      <section className="question-card">

        <div className="question-number">
          QUESTION {currentQuestion + 1}
        </div>

        <h2>
          {question.question}
        </h2>

        <div className="options">

          {question.options.map(
            (option, index) => {

              const optionLetter =
                String.fromCharCode(
                  65 + index
                );

              const isSelected =
                selectedAnswer ===
                option;

              return (
                <button
                  key={option}
                  type="button"
                  className={
                    isSelected
                      ? "answer-option selected"
                      : "answer-option"
                  }
                  onClick={() =>
                    handleAnswer(
                      option
                    )
                  }
                >

                  <span className="option-letter">
                    {optionLetter}
                  </span>

                  <span className="option-text">
                    {option}
                  </span>

                  <span className="option-check">
                    {isSelected
                      ? "✓"
                      : ""}
                  </span>

                </button>
              );
            }
          )}

        </div>

        {error && (
          <p className="quiz-error">
            {error}
          </p>
        )}

        {/* ================================= */}
        {/* Navigation */}
        {/* ================================= */}

        <div className="quiz-navigation">

          <button
            type="button"
            className="previous-button"
            onClick={handlePrevious}
            disabled={
              currentQuestion === 0
            }
          >
            ← Previous
          </button>

          <button
            type="button"
            className="next-button"
            onClick={handleNext}
            disabled={
              submitting ||
              !selectedAnswer
            }
          >
            {currentQuestion ===
            QUESTIONS.length - 1
              ? submitting
                ? "Submitting..."
                : "Finish Quiz"
              : "Next Question →"}
          </button>

        </div>

      </section>

      {/* ================================= */}
      {/* Question navigation */}
      {/* ================================= */}

      <div className="question-navigation">

        {QUESTIONS.map(
          (item, index) => {

            const answered =
              answers[index];

            return (
              <button
                key={item.id}
                type="button"
                className={`
                  question-dot
                  ${
                    index ===
                    currentQuestion
                      ? "active"
                      : ""
                  }
                  ${
                    answered
                      ? "answered"
                      : ""
                  }
                `}
                onClick={() =>
                  setCurrentQuestion(
                    index
                  )
                }
              >
                {index + 1}
              </button>
            );
          }
        )}

      </div>

    </main>
  );
}