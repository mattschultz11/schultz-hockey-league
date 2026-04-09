import { Link } from "@heroui/link";
import { BiLogoFacebook, BiLogoInstagramAlt } from "react-icons/bi";
import { MdEmail } from "react-icons/md";

export default function Footer() {
  return (
    <div className="relative mx-auto w-full max-w-7xl px-6 pb-3">
      <div className="flex flex-col items-center justify-center gap-1">
        <p className="text-default-400 text-center text-sm">
          © 2026 SHL - Schultz&nbsp;Hockey&nbsp;League, LLC. All&nbsp;rights&nbsp;reserved.
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
            href="https://www.facebook.com/groups/1337188571749789"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-70 hover:opacity-100"
            color="foreground"
          >
            <BiLogoFacebook size={28} />
          </Link>
          <Link
            aria-label="Email"
            href="mailto:support@schultzhockey.com"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-70 hover:opacity-100"
            color="foreground"
          >
            <MdEmail size={28} />
          </Link>
        </div>
      </div>
    </div>
  );
}
