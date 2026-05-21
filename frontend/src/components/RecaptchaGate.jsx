import { useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import './RecaptchaGate.css';

// Google's test key (always passes). Replace with your real site key in production.
const RECAPTCHA_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

export default function RecaptchaGate({ children }) {
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleVerify(token) {
    if (token) {
      setLoading(true);
      // Small delay for UX smoothness
      setTimeout(() => {
        setVerified(true);
        setLoading(false);
      }, 600);
    }
  }

  if (verified) return children;

  return (
    <div className="recaptcha-gate">
      <div className="recaptcha-gate-bg" />
      <div className="recaptcha-gate-shell">
        <div className="recaptcha-gate-preview" aria-hidden="true">
          <span className="recaptcha-preview-pill">Explore</span>
          <span className="recaptcha-preview-pill recaptcha-preview-pill--blue">Generate</span>
          <span className="recaptcha-preview-pill recaptcha-preview-pill--orange">Listen</span>
        </div>

        <div className="recaptcha-gate-content animate-fade-in-up" role="dialog" aria-modal="true" aria-labelledby="recaptcha-title">
          <div className="recaptcha-gate-logo animate-float">
            🦁
          </div>
          <h1 className="recaptcha-gate-title" id="recaptcha-title">
            Animal Voice <span className="text-gradient">Safari</span>
          </h1>
          <p className="recaptcha-gate-subtitle">
            Verify that you are not a robot before entering the animal explorer.
          </p>

          <div className="recaptcha-gate-widget">
            {loading ? (
              <div className="recaptcha-gate-loading">
                <div className="spinner" />
                <p>Opening your safari...</p>
              </div>
            ) : (
              <ReCAPTCHA
                sitekey={RECAPTCHA_SITE_KEY}
                onChange={handleVerify}
                theme="light"
              />
            )}
          </div>

          <p className="recaptcha-gate-footer">
            Protected by Google reCAPTCHA
          </p>
        </div>
      </div>
    </div>
  );
}
