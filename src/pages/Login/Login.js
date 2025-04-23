import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { useSnackbar } from "notistack";
import { Button, Flex, TextInput, Title, Box, Text } from "@mantine/core";
import { api } from "../../api";
import { showServerError } from "../../Components/utils/showServerError";
import { LoadingOverlay } from "../../Components/LoadingOverlay";
import "./Login.css";

const setCookieToken = (token) => {
  Cookies.set("jwt", token, {
    secure: true,
    sameSite: "None",
    expires: 1,
  });
};

export const Login = ({ onLoginSuccess }) => {
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) {
      setMessage("Invalid email address.");
      return false;
    }
    if (!form.password || form.password.length < 6) {
      setMessage("Password must be at least 6 characters long.");
      return false;
    }
    if (!isLogin && !form.username) {
      setMessage("Username is required for registration.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    const data = isLogin
      ? { email: form.email, password: form.password }
      : form;
    const request = isLogin ? api.auth.login : api.auth.register;

    try {
      const response = await request(data);
      const { token, message } = response;

      setMessage(message || "Success!");

      if (isLogin) {
        setCookieToken(token);
        navigate("/leads");

        window.location.reload();
      }
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitch = () => {
    setIsLogin(!isLogin);
    setForm({ ...form, username: "" });
    setMessage("");
  };

  return (
    <div className="body-login">
      <div className="body-login-form">
        <Box w="40%" className="login-form">
          <Title mb="md" order={2}>
            {isLogin ? "Login" : "Register"}
          </Title>
          <Box w="80%">
            {!isLogin && (
              <TextInput
                name="username"
                value={form.username}
                onChange={handleInputChange}
                placeholder="Username"
                mb="md"
                disabled={isLoading}
              />
            )}

            <TextInput
              type="email"
              name="email"
              value={form.email}
              onChange={handleInputChange}
              placeholder="Email"
              mb="md"
              disabled={isLoading}
            />

            <TextInput
              type="password"
              name="password"
              value={form.password}
              onChange={handleInputChange}
              placeholder="Password"
              mb="md"
              disabled={isLoading}
            />

            <Flex gap="md">
              <Button fullWidth disabled={isLoading} onClick={handleSubmit}>
                {isLogin ? "Login" : "Register"}
              </Button>

              <Button fullWidth onClick={handleSwitch} disabled={isLoading}>
                {isLogin ? "Register" : "Login"}
              </Button>
            </Flex>

            {isLoading && <LoadingOverlay />}

            {message && (
              <Text c="red" size="md" mt="md">
                {message}
              </Text>
            )}
          </Box>
        </Box>
      </div>
    </div>
  );
};
