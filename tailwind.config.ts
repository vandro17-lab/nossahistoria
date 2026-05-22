import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta da experiência (fonte da verdade: protótipo .jsx)
        noite: "#080503",
        ouro: {
          claro: "#e9c69a",
          DEFAULT: "#c8924f",
          escuro: "#7a5a3a",
        },
        creme: "#f0e3d2",
        areia: "#cdb89e",
        bronze: "#9c8266",
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
