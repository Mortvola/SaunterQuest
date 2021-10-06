import Http from '@mortvola/http';

async function submitForm(event, form, url, success, fail) {
  const formData = new FormData(form);

  const response = await Http.post(url, formData);

  if (response.ok) {
    if (response.headers.get('Content-Type') === 'application/json') {
      const json = await response.body();
      success(json);
    }
  }
  else if (fail) {
    if (response.status === 422) {
      const json = await response.body();
      fail(json.errors);
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
