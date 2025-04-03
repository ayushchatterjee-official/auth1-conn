
import { Helmet } from "react-helmet-async";
import LoginForm from "@/components/auth/LoginForm";

const LoginPage = () => {
  return (
    <>
      <Helmet>
        <title>Login | Auth System</title>
      </Helmet>
      <div className="auth-container">
        <LoginForm />
      </div>
    </>
  );
};

export default LoginPage;
