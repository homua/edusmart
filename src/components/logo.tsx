"use client"

interface LogoProps extends React.SVGProps<SVGSVGElement> {}

const Logo = (props: LogoProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M12 2L2 7V17L12 22L22 17V7L12 2Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      className="text-primary/50"
    />
    <path
      d="M2 7L12 12L22 7"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      className="text-primary/70"
    />
    <path
      d="M12 22V12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      className="text-primary"
    />
    <path
      d="M17 4.5L7 9.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      className="text-primary/30"
    />
  </svg>
);

export default Logo;
