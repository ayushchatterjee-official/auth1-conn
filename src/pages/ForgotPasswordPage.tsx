
import { Helmet } from "react-helmet-async";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

const ForgotPasswordPage = () => {
  return (
    <>
      <Helmet>
        <title>Forgot Password | Auth System</title>
      </Helmet>
      <div className="auth-container">
        <ForgotPasswordForm />
      </div>
    </>
  );
};

export default ForgotPasswordPage;
