import Http from '@mortvola/http';
import { isErrorResponse } from '../ResponseTypes';

async function submitForm(
  event: MouseEvent,
  form: HTMLFormElement,
  url: string,
  success: (r: unknown) => void,
  fail: (errors: unknown) => void,
): Promise<void> {
  const formData = new FormData(form);

  const data: Record<string, unknown> = {};

  console.log('form entries:');
  // eslint-disable-next-line no-restricted-syntax
  for (const pair of formData.entries()) {
    [, data[pair[0]]] = pair;
  }

  const response = await Http.post(url, data);

  if (response.ok) {
    if (response.headers.get('Content-Type') === 'application/json') {
      const body = await response.body();
      success(body);
    }
  }
  else if (fail) {
    if (response.status === 422) {
      const body = await response.body();
      if (isErrorResponse(body)) {
        fail(body.errors);
      }
    }
    else {
      fail({ general: ['An error occured. Please try again later.'] });
    }
  }

  if (event) {
    event.preventDefault();
  }
}

const defaultErrors = {
  username: [],
  password: [],
  email: [],
  general: [],
};

export { submitForm, defaultErrors };
