
import { Helmet } from "react-helmet-async";
import VerifyEmailForm from "@/components/auth/VerifyEmailForm";

const VerifyEmailPage = () => {
  return (
    <>
      <Helmet>
        <title>Verify Email | Auth System</title>
      </Helmet>
      <div className="auth-container">
        <VerifyEmailForm />
      </div>
    </>
  );
};

export default VerifyEmailPage;
