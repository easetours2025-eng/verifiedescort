-- Insert sample FAQ items for the platform

INSERT INTO faq_items (question, answer, category, display_order, is_active) VALUES
-- Getting Started
('How do I create an account?', 
'To create an account, click on the "Sign Up" button on the homepage. You can register as either a celebrity provider or a regular user. Fill in your details including your email, phone number, and create a secure password. You will receive a verification email to complete the registration process.',
'getting_started', 1, true),

('What subscription plans are available?',
'We offer flexible subscription plans for celebrity providers:
- 1 Month Plan: ₹2,000
- 3 Months Plan: ₹5,000 (Save 17%)
- 6 Months Plan: ₹9,000 (Save 25%)
- 1 Year Plan: ₹15,000 (Save 38%)

All plans include full access to upload content, manage your profile, and connect with users.',
'subscriptions', 2, true),

('How do I update my profile?',
'Once logged in, go to your Dashboard and click on the "Profile" tab. Here you can update your stage name, bio, location, pricing, social media links, and profile picture. Make sure to click "Save Profile" after making changes.',
'getting_started', 3, true),

-- Subscriptions & Payments
('How do I activate my subscription?',
'After registering, you will need to purchase a subscription plan to make your profile visible. Click on the "Subscription" tab in your dashboard, select your preferred plan, and complete the payment via M-Pesa. Once verified by our admin team, your profile will be activated.',
'subscriptions', 4, true),

('What payment methods do you accept?',
'Currently, we accept payments via M-Pesa. After selecting your subscription plan, you will receive M-Pesa payment instructions. Send the payment to the provided number and enter your M-Pesa code in the verification form. Our admin team will verify your payment within 24 hours.',
'subscriptions', 5, true),

('Can I upgrade or downgrade my subscription?',
'Yes! You can upgrade your subscription at any time from your Dashboard under the "Subscription" tab. If you want to downgrade, please contact our support team and we will assist you with the process.',
'subscriptions', 6, true),

-- Verification & Security
('How long does verification take?',
'Payment verification typically takes up to 24 hours. Our admin team manually verifies each M-Pesa transaction to ensure security. You will receive a notification once your payment is verified and your account is activated.',
'verification', 7, true),

('How is my personal information protected?',
'We take your privacy seriously. Your personal information (email, phone number, real name) is never displayed publicly. Only your stage name, bio, location (city/state only), and selected information is visible to users. All sensitive data is encrypted and stored securely.',
'verification', 8, true),

('What if I forget my password?',
'Click on "Forgot Password" on the login page. Enter your registered email address and you will receive a password reset link. Follow the instructions in the email to create a new password.',
'verification', 9, true),

-- General Questions
('Can I upload videos and photos?',
'Yes! Celebrity providers with active subscriptions can upload unlimited photos and videos to their gallery. Go to your Dashboard, click on the "Media" tab, and use the upload section to add your content. You can also mark certain content as premium.',
'general', 10, true),

('How do users contact me?',
'Users can send you messages through the platform messaging system. You will receive notifications when you have new messages. You can also display your contact information (phone, WhatsApp, social media) on your profile for direct contact.',
'general', 11, true),

('Can I pause my subscription?',
'Currently, subscriptions cannot be paused. However, if you need a break, you can let your current subscription expire and reactivate it later. Please contact support if you have special circumstances.',
'general', 12, true),

('What content is allowed on the platform?',
'All content must comply with our community guidelines and local laws. We prohibit illegal content, explicit content involving minors, content that promotes violence or hate speech, and copyrighted material you do not own. Violation of these rules may result in immediate account suspension.',
'general', 13, true);