<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f2f5f3;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f5f3;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 18px rgba(11,48,35,0.08);">
          <tr>
            <td style="background:#1d5c46;padding:22px 30px;color:#d7f26b;font-weight:bold;font-size:18px;font-family:Arial,Helvetica,sans-serif;">
              SmashPoint
            </td>
          </tr>
          <tr>
            <td style="padding:28px 30px;color:#22332c;">
              <p style="margin:0 0 6px;font-size:15px;">Hi {{ $booking->user->name }},</p>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">
                Your court is ready soon! Here are your booking details:
              </p>

              <table role="presentation" width="100%" cellpadding="10" cellspacing="0" style="background:#f4f8f5;border-radius:10px;font-size:14px;">
                <tr>
                  <td style="color:#6b7a73;width:130px;">Reference</td>
                  <td style="font-weight:bold;color:#1d5c46;">{{ $booking->reference }}</td>
                </tr>
                <tr>
                  <td style="color:#6b7a73;">Court</td>
                  <td style="font-weight:bold;">{{ $booking->court->name }}</td>
                </tr>
                <tr>
                  <td style="color:#6b7a73;">Date</td>
                  <td style="font-weight:bold;">{{ $booking->booking_date->format('D, M j, Y') }}</td>
                </tr>
                <tr>
                  <td style="color:#6b7a73;">Time</td>
                  <td style="font-weight:bold;">
                    {{ \Carbon\Carbon::parse($booking->start_time)->format('g:i A') }}
                    &ndash;
                    {{ \Carbon\Carbon::parse($booking->end_time)->format('g:i A') }}
                  </td>
                </tr>
              </table>

              <p style="margin:20px 0 0;font-size:13px;color:#6b7a73;line-height:1.6;">
                Please arrive a few minutes early. See you on the court!
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 30px 24px;color:#9aa8a1;font-size:12px;">
              This is an automated reminder from SmashPoint Court Booking.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
