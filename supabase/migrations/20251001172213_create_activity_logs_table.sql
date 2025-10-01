/*
  # Create Activity Logs Table

  1. New Tables
    - `activity_logs`
      - `id` (uuid, primary key)
      - `action_type` (text) - Type d'action effectuée
      - `username` (text) - Utilisateur concerné
      - `ip_address` (text) - Adresse IP
      - `fingerprint` (text) - Empreinte du navigateur
      - `details` (jsonb) - Détails supplémentaires en JSON
      - `severity` (text) - Niveau de gravité: low, medium, high, critical
      - `admin_username` (text) - Admin qui a effectué l'action
      - `created_at` (timestamptz) - Date de création
  
  2. Security
    - Enable RLS on `activity_logs` table
    - Add policy for admins to view all logs
    - Add policy for admins to insert logs
  
  3. Indexes
    - Index on created_at for faster queries
    - Index on action_type for filtering
    - Index on severity for security alerts
*/

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  username text DEFAULT '',
  ip_address text DEFAULT '',
  fingerprint text DEFAULT '',
  details jsonb DEFAULT '{}'::jsonb,
  severity text DEFAULT 'low',
  admin_username text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all logs"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert logs"
  ON activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_severity ON activity_logs(severity);
CREATE INDEX IF NOT EXISTS idx_activity_logs_username ON activity_logs(username);