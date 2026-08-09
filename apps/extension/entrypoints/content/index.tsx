import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './style.css';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  cssInjectionMode: 'ui',

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'bakbak-ui',
      position: 'inline',
      anchor: 'body',
      isolateEvents: true,
      onMount: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(<App ctx={ctx} />);
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    ui.autoMount();
  },
});
