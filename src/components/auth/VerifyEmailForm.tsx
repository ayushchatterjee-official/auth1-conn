
import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const formSchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits"),
});

type FormValues = z.infer<typeof formSchema>;

const VerifyEmailForm = () => {
  const { verifyEmail, sendVerificationCode } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      await verifyEmail(email, data.code);
      navigate("/login");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Email address is missing. Please try again.",
      });
      return;
    }

    setIsResending(true);
    try {
      await sendVerificationCode(email);
      toast({
        title: "Code resent",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to resend code",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <h1 className="text-2xl font-bold">Verify your email</h1>
        <p className="text-muted-foreground">
          We sent a 6-digit code to {email || "your email"}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verification Code</FormLabel>
                <FormControl>
                  <Input
                    placeholder="000000"
                    maxLength={6}
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>Verifying...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Verify Email</span>
              </div>
            )}
          </Button>
        </form>
      </Form>

      <div className="flex items-center justify-between mt-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-sm"
          onClick={handleResendCode}
          disabled={isResending}
        >
          <div className="flex items-center gap-2">
            {isResending ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <RotateCw className="h-3 w-3" />
            )}
            <span>Resend code</span>
          </div>
        </Button>

        <Link to="/login" className="text-sm text-muted-foreground hover:text-primary">
          Back to login
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmailForm;
