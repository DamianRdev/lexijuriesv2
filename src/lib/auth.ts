export interface UserSession {
  email: string;
  nombre: string;
  role: "Socio" | "Asociado";
  iniciales: string;
}

const isClient = typeof window !== "undefined";

export const auth = {
  getUser: (): UserSession | null => {
    if (!isClient) return null;
    const data = localStorage.getItem("lexpanel_user");
    if (!data) return null;
    try {
      return JSON.parse(data) as UserSession;
    } catch {
      return null;
    }
  },
  login: (email: string, pass: string): UserSession | null => {
    if (!isClient) return null;
    
    const emailLower = email.toLowerCase().trim();
    if (emailLower === "laura@lexpanel.com" && pass === "laura") {
      const user: UserSession = {
        email: "laura@lexpanel.com",
        nombre: "Dra. Laura Méndez",
        role: "Socio",
        iniciales: "LM",
      };
      localStorage.setItem("lexpanel_user", JSON.stringify(user));
      return user;
    }
    
    if (emailLower === "carlos@lexpanel.com" && pass === "carlos") {
      const user: UserSession = {
        email: "carlos@lexpanel.com",
        nombre: "Dr. Carlos Herrera",
        role: "Asociado",
        iniciales: "CH",
      };
      localStorage.setItem("lexpanel_user", JSON.stringify(user));
      return user;
    }
    
    return null;
  },
  logout: () => {
    if (!isClient) return;
    localStorage.removeItem("lexpanel_user");
  },
  isAuthenticated: (): boolean => {
    return auth.getUser() !== null;
  }
};
