const getFunction = (selector) => {
  return `function queryElements() {
    let nodes;;
    try {
      nodes = document.querySelectorAll(\`${selector.replaceAll(/'/g, "\'") }\`);
    } catch (e) {
      return {
        isError: true, 
        message: e.message.substring(e.message.indexOf(':') + 1).trim()
      }
    }
    
    const elements = [];
    nodes.forEach((node) => {
      const element = {
        id: node.id,
        classList: node.classList,
        tagName: node.tagName,
        localName: node.localName,
        // get coord from sroll position,
        // because getBoundingClientRect() is relative to viewport
        x: window.scrollX + node.getBoundingClientRect().x,
        y: window.scrollY + node.getBoundingClientRect().y,
      };
      elements.push(element);
    });
    return elements;
  }`;
}


const devtoolsElement = {
  selector: null,
  refresh: null,
  clear: null,
  count: null,
  errorContainer: null,
  matchingContainer: null,
}
let previousElements = [];

const onLoad = () => {
  queryAll();
  addListeners();
}

const queryAll = () => {
  devtoolsElement.selector = document.querySelector('#selector');
  devtoolsElement.refresh = document.querySelector('#refresh');
  devtoolsElement.clear = document.querySelector('#clear');
  devtoolsElement.count = document.querySelector('#count');
  devtoolsElement.errorContainer = document.querySelector('#errorContainer');
  devtoolsElement.matchingContainer = document.querySelector('#matchingContainer');
}

const addListeners = () => {
  devtoolsElement.refresh.addEventListener('click', refresh);
  devtoolsElement.clear.addEventListener('click', clear);
  devtoolsElement.selector.addEventListener('input', searchInput);
}

const searchInput = () => {
  const selector = devtoolsElement.selector.value;
  if (selector === '') {
    resetAll();
    return;
  }

  chrome.devtools.inspectedWindow.eval(
    `(${getFunction(selector)})()`,
    (result, isException) => {
      if (isException) {
        console.error('isException', isException);
        resetAll();
      } else {
        processResult(result);
      }
    }
  );
};

const processResult = (result) => {
  if (result.isError) {
    resetAll();
    setErrorContainer(result.message);
    return;
  }
  resetErrorContainer();
  if (result.length === 0) {
    resetMatchingContainer();
    resetCount();
    return;
  }

  if (arrayEquals(result, previousElements)) {
    return;
  }

  previousElements = result;
  resetMatchingContainer();
  setCount(result);
  setMatchingContainer(result);
}

const arrayEquals = (a, b) => {
  return Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index]);
};

const resetAll = () => {
  resetErrorContainer();
  resetMatchingContainer();
  resetCount();
};

const resetErrorContainer = () => {
  devtoolsElement.errorContainer.innerHTML = '';
};

const resetMatchingContainer = () => {
  devtoolsElement.matchingContainer.innerHTML = '';
};

const resetCount = () => {
  devtoolsElement.count.innerHTML = 0;
};

const resetSelector = () => {
  devtoolsElement.selector.value = '';
};

const refresh = () => {
  resetAll();
  searchInput();
};

const clear = () => {
  resetSelector();
};

const setCount = (elements) => {
  devtoolsElement.count.innerHTML = elements.length;
};

const setErrorContainer = (message) => {
  const error = document.createElement('div');
  error.classList.add('error');
  error.innerHTML = message;
  devtoolsElement.errorContainer.appendChild(error);
};

const generateMatchingElement = (element, index) => {
  const name = element.localName || element.tagName;
  const id = element.id ? `#${element.id}` : '';

  let classes = '';
  for (const [_, value] of Object.entries(element.classList)) {
    classes += `.${value}`;
  }
  const matchingElement = document.createElement('div');
  matchingElement.classList.add('card');
  matchingElement.innerHTML = `
    <div class="cardTitle">${name}</div>
    <div class="cardBody">${id} ${classes}</div>
  `;
  matchingElement.addEventListener('click', () => {
    const {x, y} = previousElements[index];
    chrome.devtools.inspectedWindow.eval(
      `window.scrollTo(${x}, ${y})`,
      (result, isException) => {
        if (isException) {
          console.error('error');
        }
      });
  });

  return matchingElement;
};


const setMatchingContainer = (elements) => {
  elements.forEach((element, index) => {
    const matchingElement = generateMatchingElement(element, index);
    devtoolsElement.matchingContainer.appendChild(matchingElement);
  });
};


window.addEventListener('load', onLoad, false);