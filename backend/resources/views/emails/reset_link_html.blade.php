<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background:#ffffff;color:#14231c;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;">
<p>Hi {{ $name }},</p>
<p>We received a request to reset the password for your SmashPoint account. Tap the button below to choose a new password.</p>
<p style="margin:26px 0;text-align:center;">
  <a href="{{ $url }}" style="display:inline-block;background:#177050;color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 36px;border-radius:10px;">Reset password</a>
</p>
<p>This link expires in 60 minutes.</p>
<p>If the button does not work, tap or copy this link:<br>
<a href="{{ $url }}" style="color:#177050;word-break:break-all;">{{ $url }}</a></p>
<p>If you did not request this, you can safely ignore this email.</p>
<p>-- SmashPoint</p>
</body>
</html>
