import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import emailjs from '@emailjs/browser';

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  profilePicture: string;
  dateJoined: Date;
  dateOfBirth: Date | null;
  occupation: string | null;
  isVerified: boolean;
}

// Extended user interface that includes password
interface UserWithPassword extends User {
  password: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  logout: () => void;
  verifyEmail: (email: string, code: string) => Promise<void>;
  sendVerificationCode: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  resendVerificationCode: () => Promise<void>;
}

interface SignupData {
  email: string;
  password: string;
  username: string;
  name: string;
  dateOfBirth?: Date;
  occupation?: string;
  profilePicture?: string;
}

// Mock user storage
const USERS_STORAGE_KEY = "auth_site_users";
const CURRENT_USER_KEY = "auth_site_current_user";
const VERIFICATION_CODES_KEY = "auth_site_verification_codes";
const RESET_CODES_KEY = "auth_site_reset_codes";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fix the component definition to be a proper function component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Initialize EmailJS
  useEffect(() => {
    emailjs.init("YOUR_PUBLIC_KEY"); // Replace with your EmailJS public key
  }, []);

  // Load user from local storage on initial render
  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem(CURRENT_USER_KEY);
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // Convert string dates back to Date objects
          parsedUser.dateJoined = new Date(parsedUser.dateJoined);
          if (parsedUser.dateOfBirth) {
            parsedUser.dateOfBirth = new Date(parsedUser.dateOfBirth);
          }
          setUser(parsedUser);
        } catch (error) {
          console.error("Failed to parse stored user:", error);
          localStorage.removeItem(CURRENT_USER_KEY);
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  // Helper function to get all users
  const getUsers = (): Record<string, UserWithPassword> => {
    const users = localStorage.getItem(USERS_STORAGE_KEY);
    return users ? JSON.parse(users) : {};
  };

  // Helper function to save users
  const saveUsers = (users: Record<string, UserWithPassword>) => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  };

  // Helper function to generate a verification code
  const generateVerificationCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Helper function to save a verification code
  const saveVerificationCode = (email: string, code: string) => {
    const codes = JSON.parse(localStorage.getItem(VERIFICATION_CODES_KEY) || "{}");
    codes[email] = {
      code,
      expiresAt: new Date(Date.now() + 30 * 60000).toISOString(), // 30 minutes expiry
    };
    localStorage.setItem(VERIFICATION_CODES_KEY, JSON.stringify(codes));
    return code;
  };

  // Helper function to save a reset code
  const saveResetCode = (email: string, code: string) => {
    const codes = JSON.parse(localStorage.getItem(RESET_CODES_KEY) || "{}");
    codes[email] = {
      code,
      expiresAt: new Date(Date.now() + 15 * 60000).toISOString(), // 15 minutes expiry
    };
    localStorage.setItem(RESET_CODES_KEY, JSON.stringify(codes));
    return code;
  };

  // Helper function to check if a verification code is valid
  const isValidVerificationCode = (email: string, code: string): boolean => {
    const codes = JSON.parse(localStorage.getItem(VERIFICATION_CODES_KEY) || "{}");
    const storedCode = codes[email];
    
    if (!storedCode) return false;
    
    const isExpired = new Date() > new Date(storedCode.expiresAt);
    if (isExpired) return false;
    
    return storedCode.code === code;
  };

  // Helper function to check if a reset code is valid
  const isValidResetCode = (email: string, code: string): boolean => {
    const codes = JSON.parse(localStorage.getItem(RESET_CODES_KEY) || "{}");
    const storedCode = codes[email];
    
    if (!storedCode) return false;
    
    const isExpired = new Date() > new Date(storedCode.expiresAt);
    if (isExpired) return false;
    
    return storedCode.code === code;
  };

  // Helper function to remove a verification code
  const removeVerificationCode = (email: string) => {
    const codes = JSON.parse(localStorage.getItem(VERIFICATION_CODES_KEY) || "{}");
    delete codes[email];
    localStorage.setItem(VERIFICATION_CODES_KEY, JSON.stringify(codes));
  };

  // Helper function to remove a reset code
  const removeResetCode = (email: string) => {
    const codes = JSON.parse(localStorage.getItem(RESET_CODES_KEY) || "{}");
    delete codes[email];
    localStorage.setItem(RESET_CODES_KEY, JSON.stringify(codes));
  };

  // Helper function to send an email using EmailJS
  const sendEmail = async (to: string, subject: string, message: string) => {
    try {
      const templateParams = {
        to_email: to,
        to_name: to.split('@')[0],
        from_name: "Auth System",
        subject,
        message
      };
      
      const response = await emailjs.send(
        "YOUR_SERVICE_ID", // Replace with your EmailJS service ID
        "YOUR_TEMPLATE_ID", // Replace with your EmailJS template ID
        templateParams
      );
      
      console.log('Email sent successfully:', response);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email. Please try again later.');
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    const users = getUsers();
    const foundUser = Object.values(users).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!foundUser) {
      throw new Error("Invalid email or password");
    }

    // In a real app, you would hash and compare passwords
    if (foundUser.password !== password) {
      throw new Error("Invalid email or password");
    }

    if (!foundUser.isVerified) {
      throw new Error("Please verify your email before logging in");
    }

    // Remove password from user object before storing in state
    const { password: _, ...userWithoutPassword } = foundUser;
    
    setUser(userWithoutPassword as User);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
    
    toast({
      title: "Login successful",
      description: `Welcome back, ${foundUser.name}!`,
    });
  };

  // Signup function
  const signup = async (userData: SignupData): Promise<void> => {
    const users = getUsers();
    
    // Check if email already exists
    const emailExists = Object.values(users).some(
      (u) => u.email.toLowerCase() === userData.email.toLowerCase()
    );
    
    if (emailExists) {
      throw new Error("Email already registered");
    }
    
    // Check if username already exists
    const usernameExists = Object.values(users).some(
      (u) => u.username.toLowerCase() === userData.username.toLowerCase()
    );
    
    if (usernameExists) {
      throw new Error("Username already taken");
    }

    // Create a new user
    const newUser: UserWithPassword = {
      id: crypto.randomUUID(),
      email: userData.email,
      username: userData.username,
      name: userData.name,
      profilePicture: userData.profilePicture || "https://via.placeholder.com/150",
      dateJoined: new Date(),
      dateOfBirth: userData.dateOfBirth || null,
      occupation: userData.occupation || null,
      isVerified: false,
      password: userData.password, // In a real app, this would be hashed
    };

    // Save the new user
    users[newUser.id] = newUser;
    saveUsers(users);

    // Generate and save verification code
    const verificationCode = generateVerificationCode();
    saveVerificationCode(userData.email, verificationCode);

    try {
      // Send verification email
      await sendEmail(
        userData.email,
        "Verify Your Email - Auth System",
        `Welcome to Auth System! Your verification code is: ${verificationCode}`
      );
      
      toast({
        title: "Account created",
        description: `A verification code has been sent to ${userData.email}.`,
      });
    } catch (error) {
      // Fall back to showing code if email fails
      toast({
        title: "Account created",
        description: `A verification code has been sent to ${userData.email}. The code is: ${verificationCode}`,
      });
      console.log("Verification code for testing:", verificationCode);
    }
  };

  // Verify email function
  const verifyEmail = async (email: string, code: string): Promise<void> => {
    if (!isValidVerificationCode(email, code)) {
      throw new Error("Invalid or expired verification code");
    }

    const users = getUsers();
    const userToVerify = Object.values(users).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!userToVerify) {
      throw new Error("User not found");
    }

    // Update user verification status
    userToVerify.isVerified = true;
    saveUsers(users);
    
    // Remove the verification code
    removeVerificationCode(email);

    toast({
      title: "Email verified",
      description: "Your account has been verified. You can now log in.",
    });
  };

  // Send verification code function
  const sendVerificationCode = async (email: string): Promise<void> => {
    const users = getUsers();
    const userExists = Object.values(users).some(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!userExists) {
      throw new Error("Email not registered");
    }

    // Generate and save verification code
    const verificationCode = generateVerificationCode();
    saveVerificationCode(email, verificationCode);

    try {
      // Send verification email
      await sendEmail(
        email,
        "Your Verification Code - Auth System",
        `Your verification code is: ${verificationCode}`
      );
      
      toast({
        title: "Verification code sent",
        description: `A verification code has been sent to ${email}.`,
      });
    } catch (error) {
      // Fall back to showing code if email fails
      toast({
        title: "Verification code sent",
        description: `A verification code has been sent to ${email}. The code is: ${verificationCode}`,
      });
      console.log("Verification code for testing:", verificationCode);
    }
  };

  // Resend verification code function
  const resendVerificationCode = async (): Promise<void> => {
    if (!user) return;
    
    // Generate and save verification code
    const verificationCode = generateVerificationCode();
    saveVerificationCode(user.email, verificationCode);

    try {
      // Send verification email
      await sendEmail(
        user.email,
        "Your New Verification Code - Auth System",
        `Your verification code is: ${verificationCode}`
      );
      
      toast({
        title: "Verification code resent",
        description: `A new verification code has been sent to ${user.email}.`,
      });
    } catch (error) {
      // Fall back to showing code if email fails
      toast({
        title: "Verification code resent",
        description: `A new verification code has been sent to ${user.email}. The code is: ${verificationCode}`,
      });
      console.log("Verification code for testing:", verificationCode);
    }
  };

  // Request password reset function
  const requestPasswordReset = async (email: string): Promise<void> => {
    const users = getUsers();
    const userExists = Object.values(users).some(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!userExists) {
      throw new Error("Email not registered");
    }

    // Generate and save reset code
    const resetCode = generateVerificationCode();
    saveResetCode(email, resetCode);

    try {
      // Send reset email
      await sendEmail(
        email,
        "Password Reset Code - Auth System",
        `Your password reset code is: ${resetCode}`
      );
      
      toast({
        title: "Password reset code sent",
        description: `A password reset code has been sent to ${email}.`,
      });
    } catch (error) {
      // Fall back to showing code if email fails
      toast({
        title: "Password reset code sent",
        description: `A password reset code has been sent to ${email}. The code is: ${resetCode}`,
      });
      console.log("Reset code for testing:", resetCode);
    }
  };

  // Reset password function
  const resetPassword = async (email: string, code: string, newPassword: string): Promise<void> => {
    if (!isValidResetCode(email, code)) {
      throw new Error("Invalid or expired reset code");
    }

    const users = getUsers();
    const userToUpdate = Object.values(users).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!userToUpdate) {
      throw new Error("User not found");
    }

    // Update user password
    userToUpdate.password = newPassword; // In a real app, this would be hashed
    saveUsers(users);
    
    // Remove the reset code
    removeResetCode(email);

    toast({
      title: "Password reset successful",
      description: "Your password has been reset. You can now log in with your new password.",
    });
  };

  // Update profile function
  const updateProfile = async (data: Partial<User>): Promise<void> => {
    if (!user) {
      throw new Error("Not authenticated");
    }

    const users = getUsers();
    const currentUser = users[user.id];

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Check if username is being updated and is unique
    if (data.username && data.username !== currentUser.username) {
      const usernameExists = Object.values(users).some(
        (u) => u.id !== user.id && u.username.toLowerCase() === data.username!.toLowerCase()
      );
      
      if (usernameExists) {
        throw new Error("Username already taken");
      }
    }

    // Update user data
    const updatedUser = { ...currentUser, ...data };
    users[user.id] = updatedUser;
    saveUsers(users);

    // Update current user state and local storage
    const { password: _, ...userWithoutPassword } = updatedUser;
    setUser(userWithoutPassword as User);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));

    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
    });
  };

  // Delete account function
  const deleteAccount = async (): Promise<void> => {
    if (!user) {
      throw new Error("Not authenticated");
    }

    const users = getUsers();
    delete users[user.id];
    saveUsers(users);

    // Clear user state and local storage
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);

    toast({
      title: "Account deleted",
      description: "Your account has been deleted successfully.",
    });
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
    
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    verifyEmail,
    sendVerificationCode,
    resetPassword,
    requestPasswordReset,
    updateProfile,
    deleteAccount,
    resendVerificationCode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
