export function validateEmail(email: string): string | null {
  if (!email || email.trim().length === 0) {
    return 'Email is required.';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Please enter a valid email address.';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password || password.length === 0) {
    return 'Password is required.';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters.';
  }
  return null;
}

export function validateConfirmPassword(password: string, confirmPassword: string): string | null {
  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }
  return null;
}

export function validateDisplayName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'Display name is required.';
  }
  if (name.trim().length < 2) {
    return 'Display name must be at least 2 characters.';
  }
  return null;
}

export function validateCustomPrompt(prompt: string): string | null {
  if (!prompt || prompt.trim().length === 0) {
    return 'Please enter a custom prompt.';
  }
  if (prompt.trim().length < 10) {
    return 'Prompt must be at least 10 characters.';
  }
  return null;
}
