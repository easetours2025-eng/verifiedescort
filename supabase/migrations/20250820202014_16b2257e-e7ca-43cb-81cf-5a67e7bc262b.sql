-- Add foreign key constraints for proper table relationships

-- Add foreign key from payment_verification to celebrity_profiles
ALTER TABLE payment_verification 
ADD CONSTRAINT fk_payment_verification_celebrity_id 
FOREIGN KEY (celebrity_id) REFERENCES celebrity_profiles(id) ON DELETE CASCADE;

-- Add foreign key from celebrity_subscriptions to celebrity_profiles  
ALTER TABLE celebrity_subscriptions 
ADD CONSTRAINT fk_celebrity_subscriptions_celebrity_id 
FOREIGN KEY (celebrity_id) REFERENCES celebrity_profiles(id) ON DELETE CASCADE;

-- Add foreign key from conversations to celebrity_profiles
ALTER TABLE conversations 
ADD CONSTRAINT fk_conversations_celebrity_id 
FOREIGN KEY (celebrity_id) REFERENCES celebrity_profiles(id) ON DELETE CASCADE;

-- Add foreign key from messages to conversations
ALTER TABLE messages 
ADD CONSTRAINT fk_messages_conversation_id 
FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

-- Add foreign key from celebrity_media to celebrity_profiles
ALTER TABLE celebrity_media 
ADD CONSTRAINT fk_celebrity_media_celebrity_id 
FOREIGN KEY (celebrity_id) REFERENCES celebrity_profiles(id) ON DELETE CASCADE;