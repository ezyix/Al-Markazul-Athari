"use client";
import "./globals.css"
import { useEffect, useState } from "react";
import Image from "next/image";

export default function LoadingPage() {
  const [loading, setLoading] = useState(true);
  const [gender, setGender] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <main className="loading-page">
        <div className="loading-content">
          <div className="logo-wrapper">
            <Image
              src="/logo.png"
              alt="Al Markazul Athari"
              width={180}
              height={180}
              priority
            />
          </div>

          <h1>AL MARKAZUL ATHARI</h1>
          <div className="spinner" />
        </div>
      </main>
    );
  }

  return (
    <main className="welcome-page">
        <Image
          src="/brand name.png"
          alt="Al Markazul Athari"
          width={180}
          height={180}
          priority
          className="logo"
        />
    
      <section className="welcome-card" aria-labelledby="welcome-title">
        <p className="eyebrow">WELCOME</p>
        <h1 id="welcome-title">Let&apos;s get you started.</h1>
        <p className="intro">Enter your details below. Your timer will<br className="desktop-break" /> not start yet.</p>

        <form className="quiz-form">
          <label htmlFor="full-name">Full name</label>
          <input id="full-name" name="fullName" type="text" placeholder="e.g. Aisha Rahman" required />

          <fieldset>
            <legend>Gender</legend>
            <div className="gender-options">
              <button className={gender === "Male" ? "gender-option selected" : "gender-option"} onClick={(event) => { event.preventDefault(); setGender("Male"); }} type="button">Male</button>
              <button className={gender === "Female" ? "gender-option selected" : "gender-option"} onClick={(event) => { event.preventDefault(); setGender("Female"); }} type="button">Female</button>
            </div>
          </fieldset>

          <label htmlFor="age">Age</label>
          <input id="age" name="age" type="number" min="1" max="120" placeholder="e.g. 21" required />

          <label htmlFor="whatsapp">WhatsApp number</label>
          <input id="whatsapp" name="whatsapp" type="tel" inputMode="tel" placeholder="e.g. 98765 43210" required />

          <button className="start-button" type="submit">Start the Quiz</button>
        </form>
      </section>
    </main>
  );
}