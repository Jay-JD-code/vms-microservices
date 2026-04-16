package com.vms.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class EmailService {

    private final JavaMailSender mailSender;
    
    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Autowired
    public EmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }
    
    @PostConstruct
    public void init() {
        if (mailSender != null && mailUsername != null && !mailUsername.isEmpty()) {
            log.info("EmailService initialized with username: {}", mailUsername);
        } else {
            log.warn("EmailService initialized WITHOUT email configuration. Emails will be SKIPPED.");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SHARED LAYOUT HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private String wrap(String bodyContent) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8"/>
              <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
              <title>VMS Notification</title>
            </head>
            <body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
                <tr>
                  <td align="center">
                    <table width="580" cellpadding="0" cellspacing="0"
                           style="background:#ffffff;border-radius:12px;overflow:hidden;
                                  box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                      <!-- HEADER -->
                      <tr>
                        <td style="background:linear-gradient(135deg,#1e3a5f 0%%,#2d6a9f 100%%);
                                   padding:32px 40px;text-align:center;">
                          <div style="display:inline-block;background:rgba(255,255,255,0.15);
                                      border-radius:10px;padding:8px 18px;margin-bottom:12px;">
                            <span style="color:#ffffff;font-size:22px;font-weight:700;
                                         letter-spacing:2px;">VMS</span>
                          </div>
                          <p style="margin:0;color:rgba(255,255,255,0.75);
                                    font-size:12px;letter-spacing:1px;text-transform:uppercase;">
                            Vendor Management System
                          </p>
                        </td>
                      </tr>

                      <!-- BODY -->
                      <tr>
                        <td style="padding:40px 40px 32px;">
                          %s
                        </td>
                      </tr>

                      <!-- FOOTER -->
                      <tr>
                        <td style="background:#f8fafc;border-top:1px solid #e8ecf0;
                                   padding:20px 40px;text-align:center;">
                          <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.6;">
                            This is an automated message from the Vendor Management System.<br/>
                            Please do not reply to this email.
                          </p>
                          <p style="margin:8px 0 0;color:#cbd5e1;font-size:10px;">
                            &copy; 2026 VMS &nbsp;&bull;&nbsp; All rights reserved
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(bodyContent);
    }

    private String infoRow(String label, String value) {
        return """
            <tr>
              <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;">
                <span style="color:#64748b;font-size:12px;font-weight:600;
                             text-transform:uppercase;letter-spacing:0.5px;">%s</span>
              </td>
              <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;">
                <span style="color:#1e293b;font-size:13px;font-weight:500;">%s</span>
              </td>
            </tr>
            """.formatted(label, value);
    }

    private void send(String to, String subject, String html) {
        if (mailSender == null || mailUsername == null || mailUsername.isEmpty()) {
            log.warn("⚠️ Email SKIPPED - SMTP not configured. To: {}, Subject: {}", to, subject);
            log.warn("   Please configure spring.mail.username and spring.mail.password in application.properties");
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailUsername);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("✅ Email sent → {} | Subject: {}", to, subject);
        } catch (Exception e) {
            log.error("❌ Failed to send email to {}: {}", to, e.getMessage(), e);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. OTP EMAIL
    // ─────────────────────────────────────────────────────────────────────────

    public void sendOtpEmail(String toEmail, String otp) {
        String body = """
            <h2 style="margin:0 0 6px;color:#1e293b;font-size:22px;font-weight:700;">
              Password Reset Request
            </h2>
            <p style="margin:0 0 28px;color:#64748b;font-size:14px;line-height:1.6;">
              We received a request to reset your VMS account password.
              Use the verification code below to proceed.
            </p>

            <!-- OTP BOX -->
            <div style="background:linear-gradient(135deg,#eff6ff,#dbeafe);
                        border:2px dashed #93c5fd;border-radius:12px;
                        padding:28px;text-align:center;margin-bottom:28px;">
              <p style="margin:0 0 6px;color:#3b82f6;font-size:11px;font-weight:700;
                         letter-spacing:2px;text-transform:uppercase;">
                Your Verification Code
              </p>
              <p style="margin:0;color:#1e40af;font-size:42px;font-weight:800;
                         letter-spacing:12px;font-family:'Courier New',monospace;">
                %s
              </p>
              <p style="margin:10px 0 0;color:#60a5fa;font-size:12px;">
                &#9201; Valid for <strong>5 minutes</strong>
              </p>
            </div>

            <!-- WARNING -->
            <div style="background:#fefce8;border-left:4px solid #fbbf24;
                        border-radius:6px;padding:14px 16px;margin-bottom:24px;">
              <p style="margin:0;color:#92400e;font-size:12px;line-height:1.6;">
                <strong>&#9888; Security Notice:</strong>
                If you did not request a password reset, please ignore this email.
                Your account remains secure.
              </p>
            </div>

            <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
              Never share this code with anyone, including VMS support staff.
            </p>
            """.formatted(otp);

        send(toEmail, "Your VMS Password Reset Code", wrap(body));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. VENDOR WELCOME EMAIL
    // ─────────────────────────────────────────────────────────────────────────

    public void sendVendorCredentials(String email) {
        String body = """
            <!-- SUCCESS BADGE -->
            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-flex;align-items:center;gap:8px;
                          background:linear-gradient(135deg,#dcfce7,#bbf7d0);
                          border-radius:50px;padding:10px 24px;
                          box-shadow:0 2px 8px rgba(22,163,74,0.15);">

                <span style="color:#15803d;font-size:13px;font-weight:700;
                             letter-spacing:0.5px;">
                  Vendor Account Created Successfully
                </span>
              </div>
            </div>

            <!-- WELCOME HEADING -->
            <h2 style="margin:0 0 8px;color:#0f172a;font-size:26px;font-weight:800;
                       text-align:center;letter-spacing:-0.5px;">
              Welcome to VMS
            </h2>
            <p style="margin:0 0 32px;color:#64748b;font-size:14px;
                      line-height:1.7;text-align:center;max-width:400px;
                      margin-left:auto;margin-right:auto;">
              We're glad to have you on board. Your vendor account has been
              successfully created and is currently <strong style="color:#1e3a5f;">
              pending review</strong> by our team.
            </p>

            <!-- STATUS CARD -->
            <div style="background:linear-gradient(135deg,#f0f7ff,#e8f4fd);
                        border:1px solid #bfdbfe;border-radius:12px;
                        padding:24px;margin-bottom:28px;text-align:center;">
              <div style="font-size:36px;margin-bottom:12px;">&#128338;</div>
              <p style="margin:0 0 6px;color:#1e3a5f;font-size:15px;font-weight:700;">
                Account Under Review
              </p>
              <p style="margin:0;color:#475569;font-size:13px;line-height:1.6;">
                Our team is reviewing your vendor application.<br/>
                You will receive a notification once your account is approved<br/>
                and ready to use.
              </p>
            </div>

            <!-- WHAT HAPPENS NEXT -->
            <div style="margin-bottom:28px;">
              <p style="margin:0 0 14px;color:#1e293b;font-size:13px;font-weight:700;
                         text-transform:uppercase;letter-spacing:1px;">
                What happens next?
              </p>
              <div style="display:flex;flex-direction:column;gap:10px;">
                %s
                %s
                %s
              </div>
            </div>

            <!-- ACTION BUTTON -->
            <div style="text-align:center;margin-bottom:28px;">
              <a href="#"
                 style="display:inline-block;
                        background:linear-gradient(135deg,#1e3a5f,#2d6a9f);
                        color:#ffffff;text-decoration:none;padding:14px 40px;
                        border-radius:8px;font-size:14px;font-weight:600;
                        letter-spacing:0.5px;
                        box-shadow:0 4px 14px rgba(30,58,95,0.3);">
                Visit VMS Portal &rarr;
              </a>
            </div>

            <!-- FOOTER NOTE -->
            <div style="background:#f8fafc;border:1px solid #e2e8f0;
                        border-radius:8px;padding:14px 16px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.7;">
                If you have any questions, please contact our support team.<br/>
                <strong style="color:#64748b;">Do not reply to this email directly.</strong>
              </p>
            </div>
            """.formatted(
                nextStep("1", "#1e3a5f", "Application Review",
                    "Our team will verify your vendor details within 1–2 business days."),
                nextStep("2", "#1e3a5f", "Approval Notification",
                    "You'll receive an email once your account is approved."),
                nextStep("3", "#1e3a5f", "Portal Access",
                    "Log in to the VMS portal using the credentials once your account is approved.")
            );

        send(email, "Welcome to VMS \u2014 Your Vendor Account is Ready", wrap(body));
    }

    private String nextStep(String number, String color, String title, String description) {
        return """
            <div style="display:flex;align-items:flex-start;gap:12px;
                        background:#ffffff;border:1px solid #e2e8f0;
                        border-radius:8px;padding:14px 16px;">
              <div style="min-width:26px;width:26px;height:26px;background:%s;
                          border-radius:50%%;
                          text-align:center;line-height:26px;
                          font-size:12px;font-weight:700;color:#ffffff;
                          flex-shrink:0;">%s</div>
              <div>
                <p style="margin:0 0 2px;color:#1e293b;font-size:13px;font-weight:700;">
                  %s
                </p>
                <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">
                  %s
                </p>
              </div>
            </div>
            """.formatted(color, number, title, description);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. STAFF WELCOME EMAIL
    // ─────────────────────────────────────────────────────────────────────────

    public void sendStaffCredentials(String email, String name, String role, String accessKey) {
        String roleColor = switch (role.toUpperCase()) {
            case "ADMIN"       -> "#7c3aed";
            case "PROCUREMENT" -> "#0369a1";
            case "FINANCE"     -> "#047857";
            default            -> "#1e3a5f";
        };

        String roleIcon = switch (role.toUpperCase()) {
            case "ADMIN"       -> "&#128081;";
            case "PROCUREMENT" -> "&#128203;";
            case "FINANCE"     -> "&#128200;";
            default            -> "&#128100;";
        };

        // Pre-build rows outside template to avoid %s conflicts inside infoRow
        String emailRow     = infoRow("Email Address", email);
        String accessKeyRow = infoRow("Access Key",
            "<span style=\"font-family:'Courier New',monospace;" +
            "background:#f1f5f9;padding:3px 8px;border-radius:4px;" +
            "color:#dc2626;font-weight:700;\">" + accessKey + "</span>");

        String body = """
            <!-- ROLE BADGE -->
            <div style="text-align:center;margin-bottom:28px;">
              <div style="display:inline-block;border-radius:50px;padding:8px 20px;
                          background:%s22;border:1px solid %s44;">
                <span style="color:%s;font-size:13px;font-weight:700;">
                  %s &nbsp;%s Account
                </span>
              </div>
            </div>

            <h2 style="margin:0 0 6px;color:#1e293b;font-size:22px;font-weight:700;
                       text-align:center;">
              Welcome to VMS
            </h2>
            <p style="margin:0 0 28px;color:#64748b;font-size:14px;
                      line-height:1.6;text-align:center;">
              Your VMS staff account has been set up.<br/>
              You now have access to the portal with <strong>%s</strong> privileges.
            </p>

            <!-- CREDENTIALS TABLE -->
            <div style="background:#f8fafc;border:1px solid #e2e8f0;
                        border-radius:10px;overflow:hidden;margin-bottom:28px;">
              <div style="background:%s;padding:12px 16px;">
                <p style="margin:0;color:#ffffff;font-size:12px;font-weight:700;
                           letter-spacing:1px;text-transform:uppercase;">
                  &#128273; &nbsp;Your Login Credentials
                </p>
              </div>
              <table width="100%%" cellpadding="0" cellspacing="0">
                %s
                %s
              </table>
            </div>

            <!-- ACTION BUTTON -->
            <div style="text-align:center;margin-bottom:28px;">
              <a href="#"
                 style="display:inline-block;color:#ffffff;text-decoration:none;
                        padding:14px 36px;border-radius:8px;font-size:14px;
                        font-weight:600;letter-spacing:0.5px;background:%s;">
                Access VMS Portal &rarr;
              </a>
            </div>

            <!-- SECURITY NOTICE -->
            <div style="background:#fff7ed;border-left:4px solid #f97316;
                        border-radius:6px;padding:14px 16px;">
              <p style="margin:0;color:#9a3412;font-size:12px;line-height:1.8;">
                <strong>&#128274; Security Reminder:</strong><br/>
                &bull; <strong>Change your access key on first login</strong><br/>
                &bull; Never share your credentials with colleagues<br/>
                &bull; Contact your administrator if you did not request this account
              </p>
            </div>
            """.formatted(
                roleColor,    // 1  badge background %s22
                roleColor,    // 2  badge border %s44
                roleColor,    // 3  badge text color
                roleIcon,     // 4  role icon
                role,         // 5  role name in badge
                role,         // 6  privileges text
                roleColor,    // 7  credentials header background
                emailRow,     // 8  email row
                accessKeyRow, // 9  access key row
                roleColor     // 10 button background
            );

        send(email, "VMS - Your " + role + " Account Has Been Created", wrap(body));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. VENDOR APPROVAL EMAIL
    // ─────────────────────────────────────────────────────────────────────────

    public void sendVendorApprovedEmail(String email, String companyName) {
        String body = """
            <!-- SUCCESS BADGE -->
            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-flex;align-items:center;gap:8px;
                          background:linear-gradient(135deg,#dcfce7,#bbf7d0);
                          border-radius:50px;padding:10px 24px;
                          box-shadow:0 2px 8px rgba(22,163,74,0.15);">
                <span style="color:#15803d;font-size:18px;">&#10004;</span>
                <span style="color:#15803d;font-size:13px;font-weight:700;
                             letter-spacing:0.5px;">
                  Account Approved
                </span>
              </div>
            </div>

            <h2 style="margin:0 0 8px;color:#0f172a;font-size:26px;font-weight:800;
                       text-align:center;letter-spacing:-0.5px;">
              Congratulations, %s!
            </h2>
            <p style="margin:0 0 32px;color:#64748b;font-size:14px;
                      line-height:1.7;text-align:center;max-width:400px;
                      margin-left:auto;margin-right:auto;">
              Great news! Your vendor account has been <strong style="color:#15803d;">
              approved</strong> by our team. You can now log in to the VMS portal
              and start managing your catalog items.
            </p>

            <!-- STATUS CARD -->
            <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);
                        border:1px solid #86efac;border-radius:12px;
                        padding:24px;margin-bottom:28px;text-align:center;">
              <div style="font-size:36px;margin-bottom:12px;">&#128640;</div>
              <p style="margin:0 0 6px;color:#15803d;font-size:15px;font-weight:700;">
                Your Account is Active
              </p>
              <p style="margin:0;color:#475569;font-size:13px;line-height:1.6;">
                You can now log in and add your catalog items,<br/>
                manage orders, and collaborate with organizations.
              </p>
            </div>

            <!-- NEXT STEPS -->
            <div style="margin-bottom:28px;">
              <p style="margin:0 0 14px;color:#1e293b;font-size:13px;font-weight:700;
                         text-transform:uppercase;letter-spacing:1px;">
                Getting Started
              </p>
              <div style="display:flex;flex-direction:column;gap:10px;">
                <div style="display:flex;align-items:flex-start;gap:12px;
                            background:#ffffff;border:1px solid #e2e8f0;
                            border-radius:8px;padding:14px 16px;">
                  <div style="min-width:26px;width:26px;height:26px;background:#1e3a5f;
                              border-radius:50%%;text-align:center;line-height:26px;
                              font-size:12px;font-weight:700;color:#ffffff;flex-shrink:0;">1</div>
                  <div>
                    <p style="margin:0 0 2px;color:#1e293b;font-size:13px;font-weight:700;">
                      Log in to Your Account
                    </p>
                    <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">
                      Use your registered email and password to access the VMS portal.
                    </p>
                  </div>
                </div>
                <div style="display:flex;align-items:flex-start;gap:12px;
                            background:#ffffff;border:1px solid #e2e8f0;
                            border-radius:8px;padding:14px 16px;">
                  <div style="min-width:26px;width:26px;height:26px;background:#1e3a5f;
                              border-radius:50%%;text-align:center;line-height:26px;
                              font-size:12px;font-weight:700;color:#ffffff;flex-shrink:0;">2</div>
                  <div>
                    <p style="margin:0 0 2px;color:#1e293b;font-size:13px;font-weight:700;">
                      Add Your Catalog Items
                    </p>
                    <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">
                      Upload your product catalog including descriptions, pricing, and images.
                    </p>
                  </div>
                </div>
                <div style="display:flex;align-items:flex-start;gap:12px;
                            background:#ffffff;border:1px solid #e2e8f0;
                            border-radius:8px;padding:14px 16px;">
                  <div style="min-width:26px;width:26px;height:26px;background:#1e3a5f;
                              border-radius:50%%;text-align:center;line-height:26px;
                              font-size:12px;font-weight:700;color:#ffffff;flex-shrink:0;">3</div>
                  <div>
                    <p style="margin:0 0 2px;color:#1e293b;font-size:13px;font-weight:700;">
                      Receive Partnership Requests
                    </p>
                    <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">
                      Organizations can now send you partnership requests to collaborate.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- ACTION BUTTON -->
            <div style="text-align:center;margin-bottom:28px;">
              <a href="#"
                 style="display:inline-block;
                        background:linear-gradient(135deg,#15803d,#22c55e);
                        color:#ffffff;text-decoration:none;padding:14px 40px;
                        border-radius:8px;font-size:14px;font-weight:600;
                        letter-spacing:0.5px;
                        box-shadow:0 4px 14px rgba(22,163,74,0.3);">
                Log in to VMS Portal &rarr;
              </a>
            </div>

            <!-- FOOTER NOTE -->
            <div style="background:#f8fafc;border:1px solid #e2e8f0;
                        border-radius:8px;padding:14px 16px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.7;">
                If you have any questions, please contact our support team.<br/>
                <strong style="color:#64748b;">Do not reply to this email directly.</strong>
              </p>
            </div>
            """.formatted(companyName);

        send(email, "VMS - Your Vendor Account Has Been Approved!", wrap(body));
    }
}