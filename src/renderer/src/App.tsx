import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <h1>landing page</h1>
      <button className=''>Login</button>
      <button>signup</button>
    </>
  )
}

export default App
