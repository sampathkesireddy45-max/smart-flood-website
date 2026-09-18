import os
import re
import logging
import requests
from typing import Dict, Any, Optional
from .config import settings

logger = logging.getLogger(__name__)

class SmsService:
    """
    Real-world SMS gateway service supporting Indian telecom providers
    (Fast2SMS, 2Factor) and international standards (Twilio).
    Complies with TRAI OTP delivery requirements in India.
    """
    def __init__(self):
        self.fast2sms_api_key = settings.FAST2SMS_API_KEY
        self.two_factor_api_key = settings.TWO_FACTOR_API_KEY
        self.twilio_account_sid = settings.TWILIO_ACCOUNT_SID
        self.twilio_auth_token = settings.TWILIO_AUTH_TOKEN
        self.twilio_phone_number = settings.TWILIO_PHONE_NUMBER

    def get_status(self) -> Dict[str, Any]:
        has_fast2sms = bool(self.fast2sms_api_key and len(self.fast2sms_api_key.strip()) > 5)
        has_2factor = bool(self.two_factor_api_key and len(self.two_factor_api_key.strip()) > 5)
        has_twilio = bool(
            self.twilio_account_sid
            and self.twilio_account_sid.strip().startswith("AC")
            and self.twilio_auth_token
            and len(self.twilio_auth_token.strip()) > 10
            and self.twilio_phone_number
        )

        active = None
        if has_fast2sms:
            active = "Fast2SMS (Quick OTP)"
        elif has_2factor:
            active = "2Factor.in"
        elif has_twilio:
            active = "Twilio"

        return {
            "sms_configured": bool(active),
            "active_sms_provider": active,
            "fast2sms_configured": has_fast2sms,
            "two_factor_configured": has_2factor,
            "twilio_configured": has_twilio,
            "message": (
                f"Active Gateway: {active}"
                if active
                else "No SMS gateway configured. Add Fast2SMS or Twilio credentials to dispatch real SMS."
            ),
        }

    def update_credentials(
        self,
        fast2sms_api_key: Optional[str] = None,
        two_factor_api_key: Optional[str] = None,
        twilio_account_sid: Optional[str] = None,
        twilio_auth_token: Optional[str] = None,
        twilio_phone_number: Optional[str] = None,
    ):
        """Updates in-memory settings and persists them into .env"""
        env_updates = {}
        if fast2sms_api_key is not None:
            self.fast2sms_api_key = fast2sms_api_key.strip()
            settings.FAST2SMS_API_KEY = self.fast2sms_api_key
            env_updates["FAST2SMS_API_KEY"] = self.fast2sms_api_key
        if two_factor_api_key is not None:
            self.two_factor_api_key = two_factor_api_key.strip()
            settings.TWO_FACTOR_API_KEY = self.two_factor_api_key
            env_updates["TWO_FACTOR_API_KEY"] = self.two_factor_api_key
        if twilio_account_sid is not None:
            self.twilio_account_sid = twilio_account_sid.strip()
            settings.TWILIO_ACCOUNT_SID = self.twilio_account_sid
            env_updates["TWILIO_ACCOUNT_SID"] = self.twilio_account_sid
        if twilio_auth_token is not None:
            self.twilio_auth_token = twilio_auth_token.strip()
            settings.TWILIO_AUTH_TOKEN = self.twilio_auth_token
            env_updates["TWILIO_AUTH_TOKEN"] = self.twilio_auth_token
        if twilio_phone_number is not None:
            self.twilio_phone_number = twilio_phone_number.strip()
            settings.TWILIO_PHONE_NUMBER = self.twilio_phone_number
            env_updates["TWILIO_PHONE_NUMBER"] = self.twilio_phone_number

        # Write to .env in project backend root
        env_file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
        try:
            existing_lines = []
            if os.path.exists(env_file_path):
                with open(env_file_path, "r", encoding="utf-8") as f:
                    existing_lines = f.readlines()
            
            existing_keys = {}
            for i, line in enumerate(existing_lines):
                if "=" in line and not line.strip().startswith("#"):
                    k = line.split("=")[0].strip()
                    existing_keys[k] = i

            for k, v in env_updates.items():
                new_line = f"{k}={v}\n"
                if k in existing_keys:
                    existing_lines[existing_keys[k]] = new_line
                else:
                    existing_lines.append(new_line)

            with open(env_file_path, "w", encoding="utf-8") as f:
                f.writelines(existing_lines)
        except Exception as e:
            logger.warning(f"Could not persist .env: {e}")

    def send_real_otp(self, phone: str, otp: str) -> Dict[str, Any]:
        """
        Attempts real telecom SMS delivery using configured gateways.
        Target phone must be a 10-digit Indian mobile number.
        """
        clean_phone = re.sub(r"\D", "", phone or "")
        if clean_phone.startswith("91") and len(clean_phone) == 12:
            clean_phone = clean_phone[2:]
        elif len(clean_phone) > 10:
            clean_phone = clean_phone[-10:]

        # 1. Fast2SMS (Preferred Indian OTP Route)
        if self.fast2sms_api_key and len(self.fast2sms_api_key.strip()) > 5:
            headers = {
                "authorization": self.fast2sms_api_key.strip(),
                "Content-Type": "application/json",
                "cache-control": "no-cache",
            }
            # Attempt 1: OTP Route
            try:
                url = "https://www.fast2sms.com/dev/bulkV2"
                payload = {
                    "route": "otp",
                    "variables_values": otp,
                    "numbers": clean_phone,
                }
                res = requests.post(url, json=payload, headers=headers, timeout=6.0)
                if res.status_code == 200:
                    data = res.json()
                    if data.get("return") is True:
                        return {
                            "sent": True,
                            "provider": "Fast2SMS (OTP Route)",
                            "message": f"Real SMS OTP dispatched to +91 {clean_phone} via Fast2SMS.",
                        }
            except Exception as e:
                logger.warning(f"Fast2SMS OTP route attempt failed: {e}")

            # Attempt 2: Quick SMS Route (q) - no DLT registration required
            try:
                url = "https://www.fast2sms.com/dev/bulkV2"
                payload = {
                    "route": "q",
                    "message": f"SURAKSHA: Your flood system verification OTP code is {otp}. Valid for 10 minutes.",
                    "language": "english",
                    "numbers": clean_phone,
                }
                res = requests.post(url, json=payload, headers=headers, timeout=6.0)
                if res.status_code == 200:
                    data = res.json()
                    if data.get("return") is True:
                        return {
                            "sent": True,
                            "provider": "Fast2SMS (Quick SMS)",
                            "message": f"Real SMS OTP dispatched to +91 {clean_phone} via Fast2SMS Quick SMS.",
                        }
                    else:
                        logger.warning(f"Fast2SMS Quick SMS error: {data}")
            except Exception as e:
                logger.error(f"Fast2SMS Quick SMS attempt failed: {e}")

        # 2. 2Factor.in (Indian SMS Provider)
        if self.two_factor_api_key and len(self.two_factor_api_key.strip()) > 5:
            try:
                url = f"https://2factor.in/API/V1/{self.two_factor_api_key.strip()}/SMS/{clean_phone}/{otp}/OTP1"
                res = requests.get(url, timeout=6.0)
                if res.status_code == 200:
                    data = res.json()
                    if data.get("Status") == "Success":
                        return {
                            "sent": True,
                            "provider": "2Factor.in",
                            "message": f"Real SMS OTP dispatched to +91 {clean_phone} via 2Factor.in.",
                        }
            except Exception as e:
                logger.error(f"2Factor request failed: {e}")

        # 3. Twilio (International Standard)
        if (
            self.twilio_account_sid
            and self.twilio_account_sid.strip().startswith("AC")
            and self.twilio_auth_token
            and len(self.twilio_auth_token.strip()) > 10
            and self.twilio_phone_number
        ):
            try:
                from requests.auth import HTTPBasicAuth

                url = f"https://api.twilio.com/2010-04-01/Accounts/{self.twilio_account_sid.strip()}/Messages.json"
                auth = HTTPBasicAuth(self.twilio_account_sid.strip(), self.twilio_auth_token.strip())
                data = {
                    "To": f"+91{clean_phone}",
                    "From": self.twilio_phone_number.strip(),
                    "Body": f"SURAKSHA-FLOOD: Your verification code is {otp}. Valid for 10 minutes. Do not share.",
                }
                res = requests.post(url, data=data, auth=auth, timeout=6.0)
                if res.status_code in [200, 201]:
                    return {
                        "sent": True,
                        "provider": "Twilio",
                        "message": f"Real SMS OTP dispatched to +91 {clean_phone} via Twilio.",
                    }
                else:
                    logger.warning(f"Twilio HTTP {res.status_code}: {res.text}")
            except Exception as e:
                logger.error(f"Twilio request failed: {e}")

        # If no provider is configured or all providers failed
        status_info = self.get_status()
        return {
            "sent": False,
            "provider": None,
            "message": (
                f"No live SMS gateway connected. (Test OTP generated: {otp}). "
                "To deliver real SMS to your phone, configure Fast2SMS or Twilio API key in SMS Gateway Settings."
            ),
        }

sms_service = SmsService()
