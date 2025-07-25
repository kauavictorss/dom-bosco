// Login functionality with Supabase
import { login, onAuthStateChange } from '../../../Downloads/Downloads/funda__o_dom_bosco/js/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('form-login');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-button');
    const buttonText = loginButton.querySelector('.button-text');
    const buttonLoading = loginButton.querySelector('.button-loading');
    const loginError = document.getElementById('login-error');
    const forgotPasswordLink = document.getElementById('forgot-password');

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            
            // Validate inputs
            if (!email || !password) {
                showError('Por favor, preencha todos os campos.');
                return;
            }
            
            // Show loading state
            setLoading(true);
            
            try {
                const success = await login(email, password);
                if (success) {
                    // Login successful, the auth state change will handle the redirect
                    console.log('Login successful');
                } else {
                    showError('Email ou senha inválidos. Tente novamente.');
                }
            } catch (error) {
                console.error('Login error:', error);
                showError('Ocorreu um erro ao fazer login. Tente novamente.');
            } finally {
                setLoading(false);
            }
        });
    }
    
    // Handle forgot password
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = prompt('Por favor, insira seu email para redefinir a senha:');
            
            if (email) {
                try {
                    // TODO: Implement password reset with Supabase
                    alert('Um email foi enviado com instruções para redefinir sua senha.');
                } catch (error) {
                    console.error('Password reset error:', error);
                    alert('Ocorreu um erro ao solicitar a redefinição de senha. Tente novamente.');
                }
            }
        });
    }
    
    // Check if user is already logged in
    checkAuthState();
    
    // Set up auth state change listener
    onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
            // Redirect to dashboard or home page after successful login
            window.location.href = '/dashboard.html'; // Update this to your actual dashboard URL
        }
    });
    
    // Helper functions
    function setLoading(isLoading) {
        if (isLoading) {
            buttonText.style.display = 'none';
            buttonLoading.style.display = 'inline-block';
            loginButton.disabled = true;
        } else {
            buttonText.style.display = 'inline-block';
            buttonLoading.style.display = 'none';
            loginButton.disabled = false;
        }
    }
    
    function showError(message) {
        loginError.textContent = message;
        loginError.style.display = 'block';
        
        // Hide error after 5 seconds
        setTimeout(() => {
            loginError.style.display = 'none';
        }, 5000);
    }
    
    async function checkAuthState() {
        try {
            const response = await fetch('/api/auth/session', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.user) {
                    // User is already logged in, redirect to dashboard
                    window.location.href = '/dashboard.html'; // Update this to your actual dashboard URL
                }
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
        }
    }
});
