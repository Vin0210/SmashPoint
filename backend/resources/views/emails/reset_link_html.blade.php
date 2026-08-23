<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background:#ffffff;color:#14231c;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;">
<p>Hi {{ $name }},</p>
<p>We received a request to reset the password for your SmashPoint account.</p>
<p>Tap or copy the link below to choose a new password.<br>The link expires in 60 minutes.</p>
<p><a href="{{ $url }}" style="color:#177050;word-break:break-all;">{{ $url }}</a></p>
<p>If you did not request a password reset, you can safely ignore this email.</p>
<p>-- SmashPoint</p>
</body>
</html>
