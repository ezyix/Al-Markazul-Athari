"use client";

import "./globals.css";
import "./quiz/quiz.css";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoadingPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [gender, setGender] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    whatsapp: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Loading screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Handle input changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Start quiz
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    // Basic validation
    if (!formData.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!gender) {
      setError("Please select your gender.");
      return;
    }

    if (!formData.age) {
      setError("Please enter your age.");
      return;
    }

    if (
      Number(formData.age) < 1 ||
      Number(formData.age) > 120
    ) {
      setError("Please enter a valid age.");
      return;
    }

    if (!formData.whatsapp.trim()) {
      setError("Please enter your WhatsApp number.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/participants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          gender,
          age: Number(formData.age),
          whatsapp: formData.whatsapp.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      // Save participant information locally
      localStorage.setItem(
        "quizParticipant",
        JSON.stringify(data.participant)
      );

      // Go to quiz page
      router.push(`/quiz?participantId=${data.participant.participantId}`);
    } catch (error) {
      console.error(error);
      setError(error.message || "Unable to start the quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------
  // Loading screen
  // -------------------------

  if (loading) {
    return (
      <main className="quiz-loading loading-page">
        <div className="loading-content">
          <div className="logo-wrapper">
            <Image
              src="/logo.png"
              alt="Al Markazul Athari"
              width={130}
              height={130}
              priority
            />
          </div>

          <h1>AL MARKAZUL ATHARI</h1>

          <div className="quiz-loader spinner" />
        </div>
      </main>
    );
  }

  // -------------------------
  // Welcome page
  // -------------------------

  return (
    <main className="quiz-page welcome-page">
      <Image
        src="/brand name.png"
        alt="Al Markazul Athari"
        width={180}
        height={180}
        priority
        className="logo"
      />

      <section
        className="question-card welcome-card"
        aria-labelledby="welcome-title"
      >
        <p className="question-number">WELCOME</p>

        <h2 id="welcome-title">
          Let&apos;s get you started.
        </h2>

        <p className="intro">
          Enter your details below. Your timer will
          <br className="desktop-break" />
          not start yet.
        </p>

        <form
          className="quiz-form"
          onSubmit={handleSubmit}
        >
          {/* Full Name */}

          <label htmlFor="full-name">
            Full name
          </label>

          <input
            id="full-name"
            name="fullName"
            type="text"
            placeholder="e.g. Aisha Rahman"
            value={formData.fullName}
            onChange={handleChange}
            autoComplete="name"
            required
          />

          {/* Gender */}

          <fieldset>
            <legend>Gender</legend>

            <div className="gender-options">
              <button
                type="button"
                className={
                  gender === "Male"
                    ? "gender-option selected"
                    : "gender-option"
                }
                onClick={() => setGender("Male")}
              >
                Male
              </button>

              <button
                type="button"
                className={
                  gender === "Female"
                    ? "gender-option selected"
                    : "gender-option"
                }
                onClick={() => setGender("Female")}
              >
                Female
              </button>
            </div>
          </fieldset>

          {/* Age */}

          <label htmlFor="age">
            Age
          </label>

          <input
            id="age"
            name="age"
            type="number"
            min="1"
            max="120"
            placeholder="e.g. 21"
            value={formData.age}
            onChange={handleChange}
            required
          />

          {/* WhatsApp */}

          <label htmlFor="whatsapp">
            WhatsApp number
          </label>

          <input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            inputMode="tel"
            placeholder="e.g. 98765 43210"
            value={formData.whatsapp}
            onChange={handleChange}
            autoComplete="tel"
            required
          />

          {/* Error */}

          {error && (
            <p className="quiz-error form-error">
              {error}
            </p>
          )}

          {/* Start */}

          <button
            className="next-button start-button"
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "Starting..."
              : "Start the Quiz"}
          </button>
        </form>
      </section>
    </main>
  );
}