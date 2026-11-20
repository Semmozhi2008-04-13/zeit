USE zeit;

-- Ensure phone numbers are unique for phone + password login.
-- Check duplicates before running: SELECT phone, COUNT(*) FROM `user` GROUP BY phone HAVING COUNT(*) > 1;
ALTER TABLE `user` MODIFY phone VARCHAR(20) NOT NULL;
ALTER TABLE `user` ADD UNIQUE KEY uq_user_phone (phone);

-- Registration form currently collects one free-form address field.
-- Defaults keep the existing UI unchanged while satisfying the legacy schema.
ALTER TABLE address MODIFY city VARCHAR(100) NOT NULL DEFAULT '';
ALTER TABLE address MODIFY state VARCHAR(100) NOT NULL DEFAULT '';
ALTER TABLE address MODIFY pincode VARCHAR(10) NOT NULL DEFAULT '';
ALTER TABLE address ADD COLUMN address_type VARCHAR(20) NOT NULL DEFAULT 'Home';

-- Used by the password-reset workflow.
CREATE TABLE IF NOT EXISTS password_reset (
  reset_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  expire_at DATETIME NOT NULL,
  otp_used BOOLEAN NOT NULL DEFAULT FALSE,
  INDEX idx_password_reset_user (user_id),
  CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES `user`(user_id) ON DELETE CASCADE
);
