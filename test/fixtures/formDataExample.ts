export default function formDataExample() {
  const formData = new FormData();
  const author = 'Shaun';
  const content = 'this is just a test';
  const contentType = 'text/plain';
  formData.set('author', author);
  formData.set('content', new File([content], 'this-is-a-test.txt', {
    type: 'text/plain',
  }));
  return { author, content, contentType, formData };
}
