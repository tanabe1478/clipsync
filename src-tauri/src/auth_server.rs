use std::io::{BufRead, BufReader, Read, Write};
use std::net::TcpListener;
use tauri::Emitter;

const AUTH_PORT: u16 = 54321;

const CALLBACK_HTML: &str = r#"<!DOCTYPE html>
<html>
<head><title>ClipSync - Sign In</title></head>
<body style="font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8f9fa">
<div style="text-align:center">
<h2 id="status">Signing in...</h2>
<p id="message">Please wait while we complete the sign-in process.</p>
</div>
<script>
(function() {
  const hash = window.location.hash.substring(1);
  if (!hash) {
    document.getElementById('status').textContent = 'Sign-in failed';
    document.getElementById('message').textContent = 'No authentication data received.';
    return;
  }
  fetch('/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: hash
  }).then(function() {
    document.getElementById('status').textContent = 'Sign-in successful!';
    document.getElementById('message').textContent = 'You can close this tab and return to ClipSync.';
  }).catch(function() {
    document.getElementById('status').textContent = 'Sign-in failed';
    document.getElementById('message').textContent = 'Could not communicate with ClipSync.';
  });
})();
</script>
</body>
</html>"#;

pub fn redirect_url() -> String {
    format!("http://localhost:{AUTH_PORT}/auth/callback")
}

pub fn start(app_handle: tauri::AppHandle) {
    std::thread::spawn(move || {
        let listener = match TcpListener::bind(format!("127.0.0.1:{AUTH_PORT}")) {
            Ok(l) => l,
            Err(e) => {
                log::error!("Failed to start auth callback server: {e}");
                return;
            }
        };
        log::info!("Auth callback server listening on http://localhost:{AUTH_PORT}");

        for stream in listener.incoming() {
            let mut stream = match stream {
                Ok(s) => s,
                Err(_) => continue,
            };

            let mut reader = BufReader::new(stream.try_clone().unwrap());
            let mut request_line = String::new();
            if reader.read_line(&mut request_line).is_err() {
                continue;
            }

            // Read headers to find Content-Length
            let mut content_length: usize = 0;
            loop {
                let mut header = String::new();
                if reader.read_line(&mut header).is_err() {
                    break;
                }
                if header.trim().is_empty() {
                    break;
                }
                if header.to_lowercase().starts_with("content-length:") {
                    content_length = header
                        .split(':')
                        .nth(1)
                        .and_then(|v| v.trim().parse().ok())
                        .unwrap_or(0);
                }
            }

            if request_line.starts_with("GET /auth/callback") {
                let response = format!(
                    "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: {}\r\n\r\n{}",
                    CALLBACK_HTML.len(),
                    CALLBACK_HTML
                );
                let _ = stream.write_all(response.as_bytes());
            } else if request_line.starts_with("POST /auth/token") {
                // Read the body containing the token fragment
                let mut body = vec![0u8; content_length];
                let _ = reader.read_exact(&mut body);
                let body_str = String::from_utf8_lossy(&body);

                // Construct a URL with the fragment for the frontend to parse
                let url = format!("clipsync://auth/callback#{body_str}");
                log::info!("Auth tokens received via dev callback server");
                let _ = app_handle.emit("deep-link-auth", url);

                let ok_body = "OK";
                let response = format!(
                    "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: {}\r\n\r\n{ok_body}",
                    ok_body.len()
                );
                let _ = stream.write_all(response.as_bytes());
            } else if request_line.starts_with("OPTIONS") {
                // CORS preflight
                let response = "HTTP/1.1 204 No Content\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: POST\r\nAccess-Control-Allow-Headers: Content-Type\r\n\r\n";
                let _ = stream.write_all(response.as_bytes());
            } else {
                let response = "HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\n\r\n";
                let _ = stream.write_all(response.as_bytes());
            }
        }
    });
}
