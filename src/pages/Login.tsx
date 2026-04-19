import { Chrome, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Divider from "../components/Divider";
import IconButton from "../components/IconButton";
import Input from "../components/Input";

const quotes = [
  "“The evidence links are what made moderation viable.” — A. Romero",
  "“Students speak more naturally, and I review faster.” — M. Adler",
  "“It feels like oral verification built for actual teaching.” — J. Thompson",
];

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_480px]">
      <section className="hidden bg-ink px-14 py-14 text-white lg:flex lg:flex-col">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-sm2 bg-forest" />
          <span className="font-serif text-22">Congentra</span>
        </div>
        <div className="flex flex-1 items-center">
          <div className="max-w-[520px] space-y-6">
            <h1 className="display text-48 leading-[54px] text-white">Oral verification, made reviewable.</h1>
            <p className="max-w-[500px] text-15 text-whisper">
              Congentra turns student oral responses into structured, evidence-backed results — so reviewers can focus on judgment, not transcription.
            </p>
          </div>
        </div>
        <div className="space-y-4">
          {quotes.map((quote) => (
            <p className="text-13 text-white/70" key={quote}>
              {quote}
            </p>
          ))}
        </div>
      </section>
      <section className="flex items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-[380px] space-y-8">
          <div className="space-y-2">
            <h1 className="display text-28 text-ink">Sign in to Congentra.</h1>
            <p className="text-14 text-mute">Use your institutional email.</p>
          </div>
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              navigate("/assignments");
            }}
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-13 font-medium text-ink2">Email</label>
                <Input placeholder="olivia.shaw@harvard.edu" type="email" />
              </div>
              <div className="space-y-1.5">
                <label className="text-13 font-medium text-ink2">Password</label>
                <div className="relative">
                  <Input className="pr-11" type={showPassword ? "text" : "password"} />
                  <div className="absolute right-0 top-0 p-0.5">
                    <IconButton
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((value) => !value)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </IconButton>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-13">
              <label className="flex items-center gap-2 text-mute">
                <input className="h-4 w-4 rounded-sm2 border-line text-ink focus:ring-forest/20" type="checkbox" />
                Remember me
              </label>
              <button className="text-linkBlue transition-colors duration-150 ease-out hover:text-ink" type="button">
                Forgot password?
              </button>
            </div>
            <Button className="w-full" size="lg" type="submit">
              Continue
            </Button>
            <div className="flex items-center gap-3">
              <Divider />
              <span className="text-12 text-mute">or</span>
              <Divider />
            </div>
            <Button className="w-full" leftIcon={<Chrome className="h-4 w-4" />} size="lg" variant="secondary">
              Continue with Google
            </Button>
          </form>
          <p className="text-center text-12 text-mute">By continuing you agree to our Terms and Privacy</p>
        </div>
      </section>
    </div>
  );
}
