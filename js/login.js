// Login functionality with Supabase
import { login, onAuthStateChange } from './auth.js';
import { supabase } from './supabase.js';

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
                    // Envia email de redefinição de senha usando o Supabase
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: window.location.origin + '/update-password.html' // Página para redefinir a senha
                    });
                    
                    if (error) throw error;
                    
                    alert('Um email foi enviado com instruções para redefinir sua senha. Verifique sua caixa de entrada.');
                } catch (error) {
                    console.error('Erro ao redefinir senha:', error);
                    alert('Ocorreu um erro ao solicitar a redefinição de senha. Verifique se o email está correto e tente novamente.');
                }
            }
        });
    }
    
    // Check if user is already logged in
    checkAuthState();
    
    // Set up auth state change listener
    onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
            // Redirect to home page after successful login
            window.location.href = '/index.html';
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
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (session) {
                // User is already logged in, redirect to home page
                window.location.href = '/index.html';
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
        }
    }
});
