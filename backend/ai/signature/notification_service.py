"""
Notification Service for Signature Workflows
Sends email and SMS notifications for signature requests and updates
"""

import os
import logging
from typing import Dict, List
from datetime import datetime

logger = logging.getLogger(__name__)

# Optional dependency for SMS notifications
try:
    from twilio.rest import Client as TwilioClient
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False
    logger.info("twilio not installed - SMS notifications will be disabled")


class NotificationService:
    """Handles email and SMS notifications for signature workflows"""
    
    def __init__(self):
        """Initialize notification service"""
        self.email_enabled = os.getenv('EMAIL_ENABLED', 'false').lower() == 'true'
        self.sms_enabled = os.getenv('SMS_ENABLED', 'false').lower() == 'true'
        
        # Email configuration
        self.smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_user = os.getenv('SMTP_USER', '')
        self.smtp_password = os.getenv('SMTP_PASSWORD', '')
        self.from_email = os.getenv('FROM_EMAIL', 'noreply@legalassist.com')
        
        # SMS configuration (e.g., Twilio)
        self.sms_provider = os.getenv('SMS_PROVIDER', 'twilio')
        self.sms_api_key = os.getenv('SMS_API_KEY', '')
        
        # App configuration
        self.app_name = os.getenv('APP_NAME', 'Legal Documentation Assistant')
        self.app_url = os.getenv('APP_URL', 'http://localhost:3000')
    
    def send_signature_invitation(
        self,
        recipient_email: str,
        recipient_name: str,
        document_name: str,
        sender_name: str,
        invitation_link: str
    ) -> bool:
        """
        Send signature invitation email
        
        Args:
            recipient_email: Email address of signatory
            recipient_name: Name of signatory
            document_name: Name of document to be signed
            sender_name: Name of person requesting signature
            invitation_link: Link to sign document
            
        Returns:
            Success status
        """
        subject = f"Signature Request: {document_name}"
        
        body = f"""
        Dear {recipient_name},
        
        {sender_name} has requested your digital signature on the following document:
        
        Document: {document_name}
        
        To review and sign the document, please click the link below:
        {invitation_link}
        
        This link will expire in 7 days.
        
        You will need your Aadhaar number and access to your Aadhaar-linked mobile number
        to complete the signature process.
        
        Best regards,
        {self.app_name} Team
        
        ---
        This is an automated message. Please do not reply to this email.
        """
        
        return self._send_email(recipient_email, subject, body)
    
    def send_signature_completed(
        self,
        recipient_email: str,
        recipient_name: str,
        document_name: str,
        signer_name: str,
        download_link: str
    ) -> bool:
        """Send notification when signature is completed"""
        subject = f"Document Signed: {document_name}"
        
        body = f"""
        Dear {recipient_name},
        
        {signer_name} has successfully signed the document: {document_name}
        
        You can download the signed document here:
        {download_link}
        
        The document has been digitally signed using Aadhaar-based e-Sign and is
        legally valid under the IT Act 2000.
        
        Best regards,
        {self.app_name} Team
        """
        
        return self._send_email(recipient_email, subject, body)
    
    def send_workflow_complete(
        self,
        recipients: List[Dict],
        document_name: str,
        download_link: str
    ) -> bool:
        """
        Send notification when all signatures are complete
        
        Args:
            recipients: List of dicts with 'email' and 'name'
            document_name: Name of document
            download_link: Link to download signed document
        """
        success = True
        for recipient in recipients:
            email_sent = self.send_signature_completed(
                recipient_email=recipient['email'],
                recipient_name=recipient['name'],
                document_name=document_name,
                signer_name="All Parties",
                download_link=download_link
            )
            success = success and email_sent
        
        return success
    
    def send_otp_notification(
        self,
        phone_number: str,
        recipient_name: str,
        document_name: str
    ) -> bool:
        """Send SMS notification about OTP being sent"""
        message = f"""
        {self.app_name}: An OTP has been sent to your Aadhaar-linked mobile 
        for signing {document_name}. Please check your messages.
        """
        
        return self._send_sms(phone_number, message)
    
    def send_reminder(
        self,
        recipient_email: str,
        recipient_name: str,
        document_name: str,
        invitation_link: str,
        days_remaining: int
    ) -> bool:
        """Send reminder to pending signatories"""
        subject = f"Reminder: Pending Signature Request - {document_name}"
        
        body = f"""
        Dear {recipient_name},
        
        This is a reminder that you have a pending signature request for:
        
        Document: {document_name}
        Time Remaining: {days_remaining} days
        
        Please sign the document at your earliest convenience:
        {invitation_link}
        
        Best regards,
        {self.app_name} Team
        """
        
        return self._send_email(recipient_email, subject, body)
    
    def _send_email(self, to_email: str, subject: str, body: str) -> bool:
        """Send email using SMTP"""
        if not self.email_enabled:
            logger.info(f"📧 Email disabled - Would send to {to_email}: {subject}")
            return True
        
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'plain'))
            
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"✅ Email sent to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to send email to {to_email}: {str(e)}")
            return False
    
    def _send_sms(self, phone_number: str, message: str) -> bool:
        """Send SMS using configured provider"""
        if not self.sms_enabled:
            logger.info(f"📱 SMS disabled - Would send to {phone_number}: {message[:50]}...")
            return True
        
        try:
            if self.sms_provider == 'twilio':
                return self._send_twilio_sms(phone_number, message)
            else:
                logger.warning(f"⚠️  Unknown SMS provider: {self.sms_provider}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Failed to send SMS to {phone_number}: {str(e)}")
            return False
    
    def _send_twilio_sms(self, phone_number: str, message: str) -> bool:
        """Send SMS using Twilio"""
        if not TWILIO_AVAILABLE:
            logger.warning("⚠️  Twilio not installed - cannot send SMS")
            return False
        
        try:
            account_sid = os.getenv('TWILIO_ACCOUNT_SID')
            auth_token = os.getenv('TWILIO_AUTH_TOKEN')
            from_number = os.getenv('TWILIO_PHONE_NUMBER')
            
            if not all([account_sid, auth_token, from_number]):
                logger.error("❌ Missing Twilio credentials in environment")
                return False
            
            client = TwilioClient(account_sid, auth_token)
            
            client.messages.create(
                body=message,
                from_=from_number,
                to=phone_number
            )
            
            logger.info(f"✅ SMS sent to {phone_number}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Twilio SMS failed: {str(e)}")
            return False


# Global instance
notification_service = NotificationService()
