import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const markdown = `# Privacy Policy

**Effective Date:** July 1, 2025

Super + Fun ("we," "our," or "us") operates the Currents blogging platform (the "Service"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.

By using Currents, you consent to the data practices described in this Privacy Policy. If you do not agree with the practices described in this Privacy Policy, please do not use our Service.

## 1. Information We Collect

### 1.1 Information You Provide Directly
We collect information you voluntarily provide when you:
- Create an account (username, email address, password)
- Complete your profile (display name, bio, profile picture)
- Create and publish content (blog posts, comments, images)
- Contact us for support or feedback
- Participate in surveys or promotional activities

### 1.2 Information Collected Automatically
When you use Currents, we automatically collect certain information, including:
- **Device Information:** Device type, operating system, browser type, IP address, unique device identifiers
- **Usage Information:** Pages viewed, time spent on the Service, features used, search queries
- **Location Information:** General geographic location based on IP address (we do not collect precise GPS location)
- **Log Information:** Server logs, error reports, and performance data

### 1.3 Information from Third Parties
We may receive information about you from:
- Social media platforms if you connect your accounts
- Analytics and advertising partners
- Other users who mention or tag you in content

### 1.4 Cookies and Similar Technologies
We use cookies, web beacons, and similar tracking technologies to:
- Remember your preferences and settings
- Analyze how you use our Service
- Provide personalized content and advertisements
- Improve our Service's functionality

You can control cookies through your browser settings, but disabling them may affect your experience on Currents.

## 2. How We Use Your Information

We use the information we collect to:

### 2.1 Provide and Improve Our Service
- Create and maintain your account
- Enable content creation and publishing
- Facilitate social interactions and community features
- Provide customer support
- Analyze usage patterns to improve functionality
- Develop new features and services

### 2.2 Communication
- Send account-related notifications
- Provide updates about the Service
- Respond to your inquiries and support requests
- Send promotional communications (with your consent)

### 2.3 Safety and Security
- Protect against fraud, abuse, and security threats
- Enforce our Terms and Conditions
- Comply with legal obligations
- Investigate and resolve disputes

### 2.4 Personalization
- Customize your feed and content recommendations
- Show relevant advertisements
- Suggest other users to follow or content to engage with

## 3. How We Share Your Information

### 3.1 Public Information
Content you publish on Currents (blog posts, comments, profile information) is public by default and can be viewed by other users and search engines.

### 3.2 With Your Consent
We may share your information with third parties when you give us explicit consent to do so.

### 3.3 Service Providers
We share information with trusted third-party service providers who help us operate our Service, including:
- Cloud hosting providers
- Analytics services
- Email delivery services
- Payment processors
- Customer support tools

These providers are contractually obligated to protect your information and use it only for the purposes we specify.

### 3.4 Legal Requirements
We may disclose your information if required by law or in response to:
- Court orders or legal process
- Government requests or investigations
- Protection of our rights, property, or safety
- Protection of our users or the public

### 3.5 Business Transfers
If Super + Fun is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.

### 3.6 Aggregated Information
We may share aggregated, de-identified information that cannot be used to identify you personally.

## 4. Data Retention

We retain your information for as long as your account is active or as needed to provide our Service. We may retain certain information longer if required by law or for legitimate business purposes, such as:
- Preventing fraud and abuse
- Resolving disputes
- Enforcing our agreements
- Complying with legal obligations

When you delete your account, we will delete or anonymize your personal information, though some information may remain in backups or logs for a limited time.

## 5. Your Rights and Choices

### 5.1 Account Information
You can access, update, or delete your account information through your profile settings.

### 5.2 Content Control
You can edit or delete your published content at any time. Note that content may remain cached or archived by search engines or other users.

### 5.3 Communication Preferences
You can opt out of promotional emails through your account settings or by following unsubscribe links in our emails.

### 5.4 Data Portability
You can request a copy of your data in a portable format by contacting us.

### 5.5 Account Deletion
You can delete your account at any time through your account settings or by contacting us.

### 5.6 Additional Rights (GDPR/CCPA)
If you are located in the European Union, California, or other jurisdictions with specific privacy laws, you may have additional rights, including:
- Right to access your personal information
- Right to correct inaccurate information
- Right to delete your personal information
- Right to restrict processing
- Right to data portability
- Right to object to processing
- Right to withdraw consent

To exercise these rights, please contact us at ccarella@gmail.com.

## 6. Children's Privacy

Currents is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we learn that we have collected personal information from a child under 13, we will delete that information promptly.

If you are a parent or guardian and believe your child has provided personal information to us, please contact us immediately.

## 7. International Data Transfers

Your information may be processed and stored in countries other than your own. We ensure appropriate safeguards are in place to protect your information when it is transferred internationally.

## 8. Data Security

We implement appropriate technical and organizational measures to protect your information against unauthorized access, alteration, disclosure, or destruction. However, no internet transmission or electronic storage is 100% secure, and we cannot guarantee absolute security.

Security measures include:
- Encryption of data in transit and at rest
- Regular security assessments
- Access controls and authentication
- Employee training on data protection

## 9. Third-Party Links and Services

Currents may contain links to third-party websites or integrate with third-party services. This Privacy Policy does not apply to those third parties. We encourage you to review the privacy policies of any third-party services you access.

## 10. Changes to This Privacy Policy

We may update this Privacy Policy from time to time. We will notify you of any material changes by:
- Posting the updated Privacy Policy on our Service
- Sending you an email notification
- Providing notice through our mobile application

Your continued use of Currents after the changes take effect constitutes your acceptance of the revised Privacy Policy.

## 11. Contact Us

If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:

**Super + Fun**  
Email: ccarella@gmail.com  
Address: [Insert Address]

For privacy-related inquiries, please include "Privacy Policy" in the subject line of your email.

## 12. Supplemental Notices

### 12.1 California Residents
California residents may have additional rights under the California Consumer Privacy Act (CCPA). For more information about your California privacy rights, please contact us.

### 12.2 European Union Residents
If you are located in the European Union, you have rights under the General Data Protection Regulation (GDPR). Our legal basis for processing your information includes:
- Consent for certain activities
- Contract performance for providing our Service
- Legitimate interests for improving our Service and security
- Legal obligations where required by law

---

**Last Updated:** July 1, 2025

This Privacy Policy is effective as of the date listed above and applies to all users of the Currents platform.
`;

export default function PrivacyPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="prose dark:prose-invert text-black">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    </main>
  );
}
