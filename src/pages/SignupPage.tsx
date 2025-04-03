
import { Helmet } from "react-helmet-async";
import SignupForm from "@/components/auth/SignupForm";

const SignupPage = () => {
  return (
    <>
      <Helmet>
        <title>Sign Up | Auth System</title>
      </Helmet>
      <div className="auth-container">
        <SignupForm />
      </div>
    </>
  );
};

export default SignupPage;
