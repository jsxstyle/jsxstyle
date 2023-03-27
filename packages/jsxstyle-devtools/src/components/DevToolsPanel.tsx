import { Row } from 'jsxstyle';
import { styleConstants } from '../constants';

export const DevToolsPanel: React.FC = () => {
  function handleError(error: any) {
    if (error.isError) {
      console.log(`Devtools error: ${error.code}`);
    } else {
      console.log(`JavaScript error: ${error.value}`);
    }
  }

  function handleResult(result: any) {
    if (result[1]) {
      handleError(result[1]);
    }
  }

  const evalString = "$0.style.backgroundColor = 'red'";
  const handleButtonBackgroundClick = () => {
    chrome.devtools.inspectedWindow.eval(evalString, handleResult);
  };

  const inspectString = "inspect(document.querySelector('h1'))";
  const handleInspectH1 = () => {
    chrome.devtools.inspectedWindow.eval(inspectString, handleResult);
  };

  const scriptToAttach = "document.body.innerHTML = 'Hi from the devtools';";
  const handleSendMessage = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        tabId: chrome.devtools.inspectedWindow.tabId,
        script: scriptToAttach,
      });
      console.log('response: %o', response);
    } catch (error) {
      console.log('Could not send message: %o', error);
    }
  };

  return (
    <Row
      padding={20}
      gap={10}
      backgroundColor={styleConstants.pageBackground}
      color={styleConstants.pageForeground}
    >
      <button onClick={handleButtonBackgroundClick}>
        Reddinate current element
      </button>
      <button onClick={handleInspectH1}>Inspect H1</button>
      <button onClick={handleSendMessage}>Send message</button>
    </Row>
  );
};
