import { MoodplayPage } from './app.po';

describe('moodplay App', function() {
  let page: MoodplayPage;

  beforeEach(() => {
    page = new MoodplayPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
