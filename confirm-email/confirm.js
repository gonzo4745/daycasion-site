// DayCasion email-change confirmation (https://daycasion.com/confirm-email/#token_hash=…&type=email_change).
// - The token is in the address fragment, so it is never sent to this host, and it is removed from the address bar
//   and history as soon as the page loads.
// - Opening the page does nothing: the one-time token is only used when the member taps the button, so email
//   security scanners that fetch or preview links can't use it up.
// - Supabase checks and uses the token (single use, expires). The sign-in it returns is not kept: the page reads the
//   new email address from it, ends that sign-in at once and forgets it.
(function () {
  'use strict';
  var API = 'https://zwitjkrmzkvrektahuml.supabase.co/auth/v1';
  var KEY = 'sb_publishable_rLS6pKOjZ80TtVGpkrYOsA_SyEq13Yy'; // public key (also in the app)

  // Never run inside someone else's frame.
  if (window.top !== window.self) { document.body.innerHTML = ''; return; }

  var params = {};
  (location.hash || '').replace(/^#/, '').split('&').forEach(function (kv) {
    if (!kv) return;
    var i = kv.indexOf('=');
    var k = i < 0 ? kv : kv.slice(0, i);
    var v = i < 0 ? '' : kv.slice(i + 1);
    try { params[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' ')); } catch (e) { /* malformed */ }
  });
  // Take the token out of the address bar and browser history straight away.
  try { history.replaceState(null, '', location.pathname); } catch (e) { /* ignore */ }

  var tokenHash = (params.token_hash || '').trim().toLowerCase();
  var validShape = params.type === 'email_change' && /^(pkce_)?[0-9a-f]{40,128}$/.test(tokenHash);

  function show(id) {
    ['ready', 'done', 'half', 'used', 'invalid', 'retry'].forEach(function (s) {
      document.getElementById(s).hidden = s !== id;
    });
    var el = document.getElementById(id);
    if (id !== 'ready' && el.focus) el.focus();
  }

  // The finished result is remembered for this tab only (no token or sign-in is stored), so reloading the page
  // after the token was removed from the address shows the same answer instead of "isn't complete".
  var MEMO = 'dc-email-change-result';
  function finish(result, email) {
    tokenHash = ''; // single use: never send it again from this page
    try { sessionStorage.setItem(MEMO, JSON.stringify({ r: result, e: email || '' })); } catch (e) { /* ignore */ }
    show(result);
  }

  function showEmail(email) {
    if (!email) return;
    var p = document.getElementById('done-email');
    p.textContent = 'Your DayCasion email address is now ';
    var s = document.createElement('strong');
    s.textContent = email;
    p.appendChild(s);
    p.appendChild(document.createTextNode('.'));
  }

  function retry(title, text) {
    document.getElementById('retry-title').textContent = title;
    document.getElementById('retry-text').textContent = text;
    show('retry');
  }

  function endSession(accessToken) {
    // Ends only the sign-in this page was just given; the member's other sign-ins (the app) are untouched.
    try {
      fetch(API + '/logout?scope=local', {
        method: 'POST', keepalive: true,
        headers: { apikey: KEY, Authorization: 'Bearer ' + accessToken }
      }).catch(function () {});
    } catch (e) { /* ignore */ }
  }

  var busy = false;
  function confirmChange() {
    if (busy || !tokenHash) return;
    busy = true;
    var btn = document.getElementById('confirm');
    btn.disabled = true;
    document.getElementById('busy').hidden = false;
    fetch(API + '/verify', {
      method: 'POST',
      headers: { apikey: KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'email_change', token_hash: tokenHash }),
      cache: 'no-store', credentials: 'omit'
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (b) { return { status: r.status, body: b || {} }; });
    }).then(function (res) {
      var b = res.body;
      if (res.status === 200 && b.access_token) {
        var email = b.user && b.user.email;
        endSession(b.access_token);
        b = null;
        showEmail(email);
        finish('done', email);
      } else if (res.status === 200) {
        finish('half'); // only if DayCasion ever requires both emails
      } else if (res.status === 429) {
        busy = false;
        retry('Please wait a moment', 'There have been too many attempts. Wait a few minutes, then try again. Your link hasn’t been used.');
      } else if (res.status >= 500) {
        busy = false;
        retry('We couldn’t confirm right now', 'DayCasion had a temporary problem. Please try again in a moment. Your link hasn’t been used.');
      } else {
        finish('used'); // expired, already used, or not a valid link (Supabase gives one answer for all three)
      }
    }).catch(function () {
      busy = false;
      retry('We couldn’t confirm right now', 'We couldn’t reach DayCasion. Check your connection and try again.');
    }).then(function () {
      btn.disabled = false;
      document.getElementById('busy').hidden = true;
    });
  }

  document.getElementById('confirm').addEventListener('click', confirmChange);
  document.getElementById('again').addEventListener('click', function () { show('ready'); confirmChange(); });
  if (validShape) {
    try { sessionStorage.removeItem(MEMO); } catch (e) { /* ignore */ }
    show('ready');
  } else {
    var memo = null;
    try { memo = JSON.parse(sessionStorage.getItem(MEMO) || 'null'); } catch (e) { /* ignore */ }
    if (memo && /^(done|half|used)$/.test(memo.r)) {
      if (memo.r === 'done') showEmail(memo.e);
      show(memo.r);
    } else {
      show('invalid');
    }
  }
})();
