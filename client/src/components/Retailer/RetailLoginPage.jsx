import { useState } from "react";
import RightPaneContent from "./RightPaneContent";
import { useNavigate } from "react-router-dom";
import { CardContent, TextField, Button, Typography, Link } from "@mui/material";
import axios from "axios";

const UserLoginPage = () => {
  const [flipped, setFlipped] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [signUpData, setSignUpData] = useState({ email: "", password: "", name: "" });
  const navigate = useNavigate();

  // Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUpChange = (e) => {
    setSignUpData({ ...signUpData, [e.target.name]: e.target.value });
  };

  // Flip the card
  const handleFlip = () => {
    setFlipped(!flipped);
  };

  // Handle Login - POST request
  const handleLogin = async () => {
    try {
      const response = await axios.post("https://y-api.com/login", formData, {
        headers: { "Content-Type": "application/json" },
      });
      console.log("Login Response:", response.data);
      navigate("/retailer-map");
    } catch (error) {
      console.error("Login Error:", error.response?.data || error.message);
      navigate("/retailer-map");//wrong
    }
  };

  // Handle Sign-Up - POST request
  const handleSignUp = async () => {
    try {
      const response = await axios.post("https://x-api.com/signup", signUpData, {
        headers: { "Content-Type": "application/json" },
      });
      console.log("Sign-Up Response:", response.data);
      alert("Account Created Successfully!");
      setFlipped(false); // Flip back to login
      navigate("/retailer-map");
    } catch (error) {
      console.error("Sign-Up Error:", error.response?.data || error.message);
      navigate("/retailer-map");//wrong
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#ffc221]">
      {/* Left Panel - Login & Sign-Up */}
      <div className="w-full md:w-1/2 flex justify-center items-center p-5">
        <div className={`w-full max-w-md shadow-md rounded-lg shadow-black bg-[#fff3d3] transition-transform duration-500 ${flipped ? "rotate-y-180" : ""}`}>
          {/* Login Form */}
          {!flipped ? (
            <CardContent className="flex flex-col items-center p-6">
              <Typography variant="h5" className="pl-2" fontWeight="bold">RETAIL</Typography>
              <img src="/retail_icon.png" alt="User Icon" className="h-16 w-16 my-2" />
              <Typography variant="h6" fontWeight="bold">Login</Typography>
              <form className="w-full space-y-3">
                <TextField fullWidth label="Email/User ID" name="email" variant="outlined" required onChange={handleChange} />
                <TextField fullWidth label="Password" name="password" type="password" variant="outlined" required onChange={handleChange} />
                <div className="flex justify-between w-full">
                  <Link onClick={handleFlip}>Forgot Password?</Link>
                  <Link onClick={handleFlip}>Create Account</Link>
                </div>
                <Button fullWidth variant="contained" color="primary" onClick={handleLogin}>
                  Login
                </Button>
              </form>
            </CardContent>
          ) : (
            // Sign-Up Form
            <CardContent className="flex flex-col items-center p-6">
              <Typography variant="h5" fontWeight="bold">Create Account</Typography>
              <form className="w-full space-y-3 mt-6">
                <TextField fullWidth label="Name" name="name" variant="outlined" required onChange={handleSignUpChange} />
                <TextField fullWidth label="Email" name="email" variant="outlined" required onChange={handleSignUpChange} />
                <TextField fullWidth label="Password" name="password" type="password" variant="outlined" required onChange={handleSignUpChange} />
                <Button fullWidth variant="contained" color="primary" onClick={handleSignUp}>
                  Sign Up
                </Button>
                <div className="mt-2 flex justify-center gap-2">
                  <Typography variant="subtitle1">Already have an account?</Typography>
                  <Link onClick={handleFlip}>Login</Link>
                </div>
              </form>
            </CardContent>
          )}
        </div>
      </div>

      {/* Right Panel - Carousel */}
      <div className="w-full md:w-1/2 flex justify-center items-center bg-[#0c3e7b] p-16">
        <RightPaneContent />
      </div>
    </div>
  );
};

export default UserLoginPage;