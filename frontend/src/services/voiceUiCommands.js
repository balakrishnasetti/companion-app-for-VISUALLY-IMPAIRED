const WAKE_WORD_PREFIX = /^(?:hey\s+)?(?:bala|mala|baila|baala|balah|bye|బాలా|బాల|बाला)[\s,.:;-]*/i;

const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

export function parseVoiceUiCommand(phrase) {
  const command = phrase.replace(WAKE_WORD_PREFIX, '').trim();
  if (/^(?:confirm|yes|do it|go ahead|confirmar|sí|de acuerdo|निश्चित करें|पुष्टि करें|हाँ|అవును|నిర్ధారించు)[.! ]*$/i.test(command)) return { action: 'CONFIRM' };
  if (/^(?:cancel that|cancel action|never mind|nevermind|cancelar|anular|रद्द करें|रद्द करो|रहने दो|రద్దు చేయి|వద్దు)[.! ]*$/i.test(command)) return { action: 'CANCEL' };
  if (/^(?:where am i|what is my location|share (?:my )?(?:current )?location|use (?:my )?(?:current )?location|update (?:my )?(?:current )?location)[.!?]*$/i.test(command)) {
    return { action: 'ACTIVATE_CONTROL', target: 'my location' };
  }
  if (/^(?:read|describe) (?:this )?(?:screen|page|what is on screen)[.!?]*$|^(?:lee|leer|describe) (?:esta )?(?:pantalla|página)[.!?]*$|^(?:lee|leer) la pantalla[.!?]*$|^(?:स्क्रीन|पृष्ठ) पढ़ें[.!?]*$|^(?:स्क्रीन|पेज) पढ़ो[.!?]*$|^(?:తెరను|స్క్రీన్‌ను) చదువు[.!?]*$/i.test(command)) return { action: 'READ_SCREEN' };
  if (/^(?:scroll|move) (?:the page )?(up|down)[.!?]*$|^(?:desplázate|desplazar|desplázate hacia|baja|sube) (?:hacia )?(arriba|abajo)[.!?]*$|^(?:नीचे|ऊपर) स्क्रॉल करें[.!?]*$|^(?:కిందికి|పైకి) స్క్రోల్ చేయి[.!?]*$/i.test(command)) {
    const direction = /\b(?:up|arriba|ऊपर|పైకి)\b/i.test(command) ? 'up' : 'down';
    return { action: 'SCROLL', direction };
  }
  if (/^(?:scroll|go) to (?:the )?(top|bottom)[.!?]*$|^(?:ve|ir) (?:al|a la) (?:principio|final)[.!?]*$|^(?:arriba|abajo) del todo[.!?]*$|^(?:सबसे ऊपर|सबसे नीचे) जाएँ[.!?]*$|^(?:పైకి|కిందికి) వెళ్ళు[.!?]*$/i.test(command)) {
    const position = /\b(?:top|principio|arriba|ऊपर|పైకి)\b/i.test(command) ? 'top' : 'bottom';
    return { action: 'SCROLL_TO', position };
  }
  if (/^(?:take|capture) (?:a )?(?:photo|picture|image)[.!?]*$|^(?:toma|saca|haz) (?:una )?(?:foto|fotografía|imagen)[.!?]*$|^(?:फोटो|तस्वीर) (?:लो|खींचो|लें)[.!?]*$|^(?:ఫోటో|చిత్రం) (?:తీయి|తీయండి)[.!?]*$/i.test(command)) return { action: 'ACTIVATE_CONTROL', target: 'capture photo' };
  if (/^analy[sz]e (?:this )?(?:image|photo)[.!?]*$|^(?:analiza|examinar|analiza esta) (?:la )?(?:imagen|foto)[.!?]*$|^(?:तस्वीर|फोटो) का विश्लेषण करें[.!?]*$|^(?:చిత్రాన్ని|ఫోటోను) విశ్లేషించు[.!?]*$/i.test(command)) return { action: 'ACTIVATE_CONTROL', target: 'ask bala' };

  const fieldMatch = command.match(/^(?:focus|move to|go to) (?:the )?(?:field|input|text box|search box) (.+)$|^(?:enfoca|ve a|ir al) (?:el )?(?:campo|cuadro de texto) (.+)$|^(?:फील्ड|क्षेत्र) (.+) पर जाएँ$|^(?:ఫీల్డ్|ఇన్‌పుట్) (.+) కు వెళ్ళు$/i);
  if (fieldMatch) return { action: 'FOCUS_FIELD', target: (fieldMatch[1] || fieldMatch[2] || fieldMatch[3] || fieldMatch[4]).replace(/[.!?]+$/, '').trim() };

  const fillMatch = command.match(/^(?:type|enter|write|fill) (.+) (?:in|into) (?:the )?(?:field|input|text box|search box )?(.+)$/i);
  if (fillMatch) return { action: 'FILL_FIELD', value: fillMatch[1].replace(/[.!?]+$/, '').trim(), target: fillMatch[2].replace(/[.!?]+$/, '').trim() };

  const selectMatch = command.match(/^select (.+) (?:in|for) (?:the )?(.+)$/i);
  if (selectMatch) return { action: 'SELECT_OPTION', value: selectMatch[1].replace(/[.!?]+$/, '').trim(), target: selectMatch[2].replace(/[.!?]+$/, '').trim() };

  const checkMatch = command.match(/^(check|uncheck|enable|disable) (?:the )?(?:checkbox|option|setting )?(.+)$/i);
  if (checkMatch) return { action: 'SET_CHECKED', checked: ['check', 'enable'].includes(checkMatch[1].toLowerCase()), target: checkMatch[2].replace(/[.!?]+$/, '').trim() };

  const activateMatch = command.match(/^(activate|click|press|tap|open|start|ask|submit|send|save|delete|remove|call|dial) (?:the )?(?:button|link|control )?(.+)$/i);
  if (activateMatch) {
    const verb = activateMatch[1].toLowerCase();
    const target = activateMatch[2].replace(/[.!?]+$/, '').trim().toLowerCase();
    const fullLabelVerbs = ['submit', 'send', 'save', 'delete', 'remove', 'call', 'dial', 'ask'];
    return { action: 'ACTIVATE_CONTROL', target: fullLabelVerbs.includes(verb) ? `${verb} ${target}` : target };
  }
  return null;
}

function controlNames(element) {
  const labels = element.labels ? Array.from(element.labels, (label) => label.textContent) : [];
  return [
    element.getAttribute('aria-label'),
    ...labels,
    element.getAttribute('title'),
    element.getAttribute('placeholder'),
    element.getAttribute('name'),
    element.id,
    element.textContent,
  ].filter(Boolean).map(normalize).filter((name, index, names) => name && names.indexOf(name) === index);
}

function controlName(element) {
  return controlNames(element)[0] || '';
}

function isVisible(element) {
  if (element.hidden || element.getAttribute('aria-hidden') === 'true') return false;
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
}

function findUnique(elements, target) {
  const query = normalize(target);
  if (query.length < 2) return { error: 'Please say the full name of the control or field.' };
  const matches = elements.filter((element) => {
    if (!isVisible(element) || element.disabled || element.getAttribute('aria-disabled') === 'true') return false;
    return controlNames(element).some((name) => name.length >= 2 && (
      name === query || name.includes(query) || (query.length >= 4 && name.length >= 4 && query.includes(name))
    ));
  });
  if (matches.length === 1) return { element: matches[0] };
  if (matches.length > 1) return { error: `I found more than one control called “${target}”. Please say its full label.` };
  return { error: `I could not find a visible control called “${target}”.` };
}

function fieldElements() {
  return Array.from(document.querySelectorAll('input:not([type="hidden"]), textarea, select'));
}

function setFieldValue(element, value) {
  if (element instanceof HTMLSelectElement) {
    const wanted = normalize(value);
    const options = Array.from(element.options).filter((option) => normalize(option.label) === wanted || normalize(option.value) === wanted);
    if (options.length !== 1) return { error: options.length ? `There is more than one “${value}” option.` : `I could not find the “${value}” option.` };
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
    setter.call(element, options[0].value);
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return { message: `Selected ${options[0].label}.` };
  }
  if (element instanceof HTMLInputElement && ['password', 'file', 'hidden'].includes(element.type)) {
    return { error: element.type === 'password'
      ? 'For your security, BALA cannot enter or speak passwords.'
      : 'Your browser only opens the camera or file picker after a direct tap. Please use the visible control.' };
  }
  if (element.readOnly) return { error: 'That field cannot be edited.' };
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, value);
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  return { message: `Entered the requested text in ${controlName(element) || 'the field'}.` };
}

const CONFIRMATION_REQUIRED = /\b(?:send|submit|save|delete|remove|call|dial|sos|emergency|report|request|accept|reject|join|cancel|clear|open walking directions|connect)\b/i;

export function executeVoiceUiCommand(command) {
  if (command.action === 'READ_SCREEN') {
    const content = document.querySelector('main')?.innerText?.replace(/\s+/g, ' ').trim();
    if (!content) return { error: 'There is no page content to read.' };
    return { message: content.slice(0, 1200) + (content.length > 1200 ? ' The rest of the page is not included.' : '') };
  }
  if (command.action === 'SCROLL') {
    window.scrollBy({ top: command.direction === 'down' ? window.innerHeight * 0.8 : -window.innerHeight * 0.8, behavior: 'smooth' });
    return { message: `Scrolling ${command.direction}.` };
  }
  if (command.action === 'SCROLL_TO') {
    window.scrollTo({ top: command.position === 'bottom' ? document.documentElement.scrollHeight : 0, behavior: 'smooth' });
    return { message: `Moving to the ${command.position} of the page.` };
  }

  const isField = ['FOCUS_FIELD', 'FILL_FIELD', 'SELECT_OPTION', 'SET_CHECKED'].includes(command.action);
  const candidates = isField
    ? fieldElements()
    : Array.from(document.querySelectorAll('button, a[href], [role="button"]'));
  const match = findUnique(candidates, command.target);
  if (!match.element) {
    if (command.action === 'ACTIVATE_CONTROL' && normalize(command.target) === 'my location') {
      const nearMe = findUnique(candidates, 'show near me');
      if (nearMe.element) {
        nearMe.element.click();
        return { message: 'Getting your current location and showing nearby reports.' };
      }
    }
    if (match.error.startsWith('I could not find') && command.action === 'ACTIVATE_CONTROL' && normalize(command.target) === 'capture photo') {
      const camera = findUnique(candidates, 'open camera');
      if (camera.element) {
        camera.element.click();
        return { message: 'The camera is opening. When it is ready, say “take a photo”.' };
      }
    }
    return { error: match.error, notFound: match.error.startsWith('I could not find') };
  }
  const element = match.element;

  if (command.action === 'FOCUS_FIELD') {
    if (element instanceof HTMLInputElement && ['password', 'file', 'hidden'].includes(element.type)) {
      return { error: element.type === 'password' ? 'For your security, BALA cannot focus password fields.' : 'Please use the visible control to open the camera or choose a file.' };
    }
    element.focus();
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return { message: `Focused ${controlName(element) || 'the field'}.` };
  }
  if (command.action === 'FILL_FIELD' || command.action === 'SELECT_OPTION') {
    return setFieldValue(element, command.value);
  }
  if (command.action === 'SET_CHECKED') {
    if (!(element instanceof HTMLInputElement) || !['checkbox', 'radio'].includes(element.type)) {
      return { error: 'That is not a checkbox or radio option.' };
    }
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked').set;
    setter.call(element, command.checked);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return { message: `${command.checked ? 'Checked' : 'Unchecked'} ${controlName(element) || 'the option'}.` };
  }

  const label = controlName(element);
  if (/\b(?:take a photo|upload|choose .*file|open camera)\b/i.test(label)) {
    return { error: 'Your browser only opens the camera or file picker after a direct tap. Please use the visible control.' };
  }
  if (element instanceof HTMLInputElement && element.type === 'file') {
    return { error: 'Your browser only opens the camera or file picker after a direct tap. Please use the visible control.' };
  }
  if (CONFIRMATION_REQUIRED.test(label)) {
    return { confirmationRequired: true, element, label };
  }
  element.click();
  return { message: `Activated ${label || 'the control'}.` };
}

export function activateConfirmedVoiceControl(element) {
  if (!element?.isConnected || element.disabled || element.getAttribute('aria-disabled') === 'true') {
    return { error: 'That control is no longer available. Please try the command again.' };
  }
  element.click();
  return { message: 'Done. The requested control was activated.' };
}
