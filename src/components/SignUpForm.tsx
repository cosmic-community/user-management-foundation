'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from './ui/Input';
import Button from './ui/Button';
import { SignUpFormData, FormErrors } from '@/src/types/auth';
import { validateSignUpForm } from '@/src/utils/validation';

export default function SignUpForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<SignUpFormData>({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    phone: '',
    bio: '',
    profileVisibility: 'public',
    newsletterSubscription: false
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear submit message when user starts typing
    if (submitMessage) {
      setSubmitMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    console.log('Form submitted with data:', { ...formData, password: '[HIDDEN]', confirmPassword: '[HIDDEN]' });

    // Validate form
    const validationErrors = validateSignUpForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      console.log('Form validation failed:', validationErrors);
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Sending signup request...');
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        setSubmitMessage({ type: 'success', text: data.message });
        console.log('Account created successfully!');
        
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          username: '',
          password: '',
          confirmPassword: '',
          phone: '',
          bio: '',
          profileVisibility: 'public',
          newsletterSubscription: false
        });
        
        // Redirect to home page after success
        setTimeout(() => {
          router.push('/?signup=success');
        }, 2000);
      } else {
        console.log('Signup failed:', data.message);
        setSubmitMessage({ type: 'error', text: data.message });
        if (data.errors) {
          setErrors(data.errors);
        }
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      setSubmitMessage({ 
        type: 'error', 
        text: 'Network error. Please check your connection and try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitMessage && (
        <div className={`p-4 rounded-md ${
          submitMessage.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {submitMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="First Name"
          name="firstName"
          type="text"
          value={formData.firstName}
          onChange={handleInputChange}
          error={errors.firstName}
          required
        />
        <Input
          label="Last Name"
          name="lastName"
          type="text"
          value={formData.lastName}
          onChange={handleInputChange}
          error={errors.lastName}
          required
        />
      </div>

      <Input
        label="Email Address"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleInputChange}
        error={errors.email}
        helpText="We'll use this for login and important notifications"
        required
      />

      <Input
        label="Username"
        name="username"
        type="text"
        value={formData.username}
        onChange={handleInputChange}
        error={errors.username}
        helpText="3-30 characters, letters, numbers, and underscores only"
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleInputChange}
          error={errors.password}
          helpText="At least 8 characters with uppercase, lowercase, and number"
          required
        />
        <Input
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          error={errors.confirmPassword}
          required
        />
      </div>

      <Input
        label="Phone Number (Optional)"
        name="phone"
        type="tel"
        value={formData.phone}
        onChange={handleInputChange}
        error={errors.phone}
        helpText="For account recovery purposes"
      />

      <div className="space-y-1">
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
          Bio (Optional)
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          value={formData.bio}
          onChange={handleInputChange}
          className={`
            block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
            focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 
            ${errors.bio ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}
          `.trim()}
          placeholder="Tell us a bit about yourself..."
        />
        {errors.bio && (
          <p className="text-sm text-red-600">{errors.bio}</p>
        )}
        <p className="text-sm text-gray-500">
          {formData.bio?.length || 0}/500 characters
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="profileVisibility" className="block text-sm font-medium text-gray-700">
          Profile Visibility
        </label>
        <select
          id="profileVisibility"
          name="profileVisibility"
          value={formData.profileVisibility}
          onChange={handleInputChange}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="public">Public - Anyone can see your profile</option>
          <option value="friends">Friends Only - Only friends can see your profile</option>
          <option value="private">Private - Only you can see your profile</option>
        </select>
      </div>

      <div className="flex items-center">
        <input
          id="newsletterSubscription"
          name="newsletterSubscription"
          type="checkbox"
          checked={formData.newsletterSubscription}
          onChange={handleInputChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="newsletterSubscription" className="ml-2 block text-sm text-gray-700">
          Subscribe to our newsletter for updates and tips
        </label>
      </div>

      <Button
        type="submit"
        size="lg"
        loading={isSubmitting}
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Creating Account...' : 'Create Account'}
      </Button>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in here
          </a>
        </p>
      </div>
    </form>
  );
}