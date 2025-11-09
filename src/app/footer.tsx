import { Link } from "@heroui/link";
import { BiLogoFacebook, BiLogoGithub, BiLogoInstagramAlt } from "react-icons/bi";

export default function Footer() {
  return (
    <div className="relative mx-auto w-full max-w-7xl px-6 pb-3">
      <div className="flex flex-col items-center justify-center gap-1">
        <p className="text-default-400 text-sm">
          © 2025 SHL - Schultz Hockey League, LLC. All rights reserved.
        </p>
        <div className="flex items-center gap-1">
          <Link
            aria-label="Instagram"
            href="https://instagram.com/schultzhockeyleague"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-70 hover:opacity-100"
            color="foreground"
          >
            <BiLogoInstagramAlt size={28} />
          </Link>
          <Link
            aria-label="Facebook"
            href="https://facebook.com/schultzhockeyleague"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-70 hover:opacity-100"
            color="foreground"
          >
            <BiLogoFacebook size={28} />
          </Link>
          <Link
            aria-label="Github"
            href="https://github.com/mattschultz11/schultz-hockey-league"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-70 hover:opacity-100"
            color="foreground"
          >
            <BiLogoGithub size={28} />
          </Link>
        </div>
      </div>
    </div>
  );
}
