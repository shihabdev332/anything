import React, { useEffect, useState } from "react";
import Title from "../component/Title";
import Input from "../component/Input";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../../config";
import toast from "react-hot-toast";
import { clearAuthSession, getAuthToken, setAuthSession } from "../auth/session";
import Seo from "../component/Seo";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [errPassword, setErrPassword] = useState("");
  const [errEmail, setErrEmail] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      axios.get(`${serverUrl}/api/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(({ data }) => {
        if (data?.success && data.user) {
          setAuthSession(token, data.user);
          navigate(data.user.isOwner ? "/owner" : "/", { replace: true });
        }
      }).catch(() => {
        clearAuthSession();
      });
    }
  }, [navigate]);

  const handleEmail = (e) => {
    setEmail(e.target.value);
    setErrEmail("");
  };

  const handlePassword = (e) => {
    setPassword(e.target.value);
    setErrPassword("");
  };

  const EmailValidation = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email) setErrEmail("Enter Your Email");
    if (!password) setErrPassword("Enter Password");

    if (email && password && EmailValidation(email)) {
      try {
        setLoading(true);
        const response = await axios.post(`${serverUrl}/api/user/login`, {
          email,
          password,
        });
        const data = response?.data;

        if (data?.success) {
          if (data.user?.isOwner) {
            setAuthSession(data.token, data.user);
            toast.success("Owner signed in.");
            navigate("/owner", { replace: true });
          } else if (data.user?.isDeliveryMan) {
            setAuthSession(data.token, data.user);
            toast.success("Delivery partner signed in.");
            navigate("/", { replace: true });
          } else if (data.user?.isAdmin) {
            setAuthSession(data.token, data.user);
            toast.success("Seller signed in. You can manage your store from Profile.");
            navigate("/", { replace: true });
          } else {
            setAuthSession(data.token, data.user);
            toast.success(data.message);
            navigate("/", { replace: true });
          }
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        console.log("User Login Error", error);
        toast.error("Login failed, please try again!");
      } finally {
        setLoading(false);
      }
    }
  };
  return (
    <div className="w-full flex h-full items-center justify-center">
      <Seo title="Sign In | Digital Store" description="Sign in to your Digital Store account to shop, track orders or manage your seller store." path="/signIn" noindex />
      <form className="w-full max-w-lg flex items-center justify-center mx-4 border border-gray-300 my-20 rounded-md shadow-sm shadow-orange-400">
        <div className="px-6 py-4 flex flex-col justify-center">
          <Title className="underline underline-offset-4 decoration-[1px] mb-4">
            Sign In
          </Title>
          <div>
            <div className="flex flex-col gap-0.5">
              <label htmlFor="email">Work Email</label>
              <Input
                placeholder="john@gmail.com"
                type="email"
                onChange={handleEmail}
                value={email}
              />
              {errEmail && (
                <p className="font-bold italic text-red-500 mr-1">
                  <span>!</span>
                  {errEmail}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-0.5 mt-3">
              <label htmlFor="password">Your Password</label>
              <Input
                placeholder="Enter Password"
                type="password"
                onChange={handlePassword}
                value={password}
              />
              {errPassword && (
                <p className="font-semibold italic text-red-500 mr-1">
                  <span>!</span>
                  {errPassword}
                </p>
              )}
            </div>
            <div>
              <button
                onClick={handleSignIn}
                disabled={!EmailValidation(email) || !password || loading}
                className="bg-black/80 hover:bg-black text-white hover:text-white cursor-pointer w-full text-base font-medium rounded-md duration-300 ease-in-out mt-3"
              >
                {loading ? "Processing" : "Sign In"}
              </button>
              <p className="text-sm items-center font-semibold ">
                Don't Have an Account?{" "}
                <Link to="/signup">
                  <span className="font-bold cursor-pointer text-blue-500 text-[17px] hover:underline duration-300 ease-in-out">
                    Sign Up
                  </span>
                </Link>
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SignIn;
