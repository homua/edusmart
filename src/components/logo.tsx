"use client"

interface LogoProps extends React.SVGProps<SVGSVGElement> {}

const Logo = (props: LogoProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Trang sách bên trái */}
    <path
      d="M12 21C12 21 10 19 4 19C3 19 2 19.5 2 20.5V6.5C2 5.5 3 5 4 5C10 5 12 7 12 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary"
    />
    {/* Trang sách bên phải */}
    <path
      d="M12 21C12 21 14 19 20 19C21 19 22 19.5 22 20.5V6.5C22 5.5 21 5 20 5C14 5 12 7 12 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary"
    />
    {/* Gáy sách */}
    <path
      d="M12 7V21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="text-primary/40"
    />
    {/* Biểu tượng thông minh (Sparkle) */}
    <path
      d="M12 3L13 5L15 6L13 7L12 9L11 7L9 6L11 5L12 3Z"
      fill="currentColor"
      className="text-accent"
    />
  </svg>
);

export default Logo;
