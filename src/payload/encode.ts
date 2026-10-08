export type QrPayload =
  | { kind: 'text'; value: string }
  | { kind: 'url'; value: string }
  | { kind: 'email'; address: string; subject?: string; body?: string }
  | { kind: 'phone'; number: string }
  | { kind: 'sms'; number: string; message?: string }
  | { kind: 'wifi'; ssid: string; password?: string; security: 'WPA' | 'WEP' | 'nopass'; hidden?: boolean };
const escapeWifi = (value: string): string => value.replace(/([\\;,":])/g, '\\$1');
export function encodePayload(input: QrPayload): string {
  switch (input.kind) {
    case 'text': return input.value;
    case 'url': {
      const value = new URL(input.value);
      if (!['http:', 'https:'].includes(value.protocol)) throw new Error('URL must use http or https');
      return input.value;
    }
    case 'email': {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.address)) throw new Error('Invalid email address');
      const params = new URLSearchParams();
      if (input.subject) params.set('subject', input.subject);
      if (input.body) params.set('body', input.body);
      return 'mailto:' + input.address + (params.size ? '?' + params.toString() : '');
    }
    case 'phone': {
      if (!/^\+?[0-9 ()-]{3,30}$/.test(input.number)) throw new Error('Invalid phone number');
      return 'tel:' + input.number.replace(/[ ()-]/g, '');
    }
    case 'sms': {
      if (!/^\+?[0-9 ()-]{3,30}$/.test(input.number)) throw new Error('Invalid SMS number');
      const number = input.number.replace(/[ ()-]/g, '');
      return 'sms:' + number + (input.message ? '?body=' + encodeURIComponent(input.message) : '');
    }
    case 'wifi': {
      if (!input.ssid) throw new Error('Wi-Fi SSID is required');
      if (input.security !== 'nopass' && !input.password) throw new Error('Wi-Fi password is required');
      const password = input.security === 'nopass' ? '' : input.password ?? '';
      return 'WIFI:T:' + input.security + ';S:' + escapeWifi(input.ssid) + ';P:' + escapeWifi(password) + ';H:' + (input.hidden ? 'true' : 'false') + ';;';
    }
  }
}
