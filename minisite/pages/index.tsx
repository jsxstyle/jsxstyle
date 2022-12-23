import { Chrome } from '../components/Chrome';
import { LiveEditor } from '../components/LiveEditor';
import { EXPERIMENTAL_makeComponent } from 'jsxstyle';

const Header = EXPERIMENTAL_makeComponent({
  displayName: 'Header',
  defaultStyles: { color: 'blue' },
  customProps: {
    /** Bananas are cool */
    banana: (value: number) => ({
      height: value,
      width: value,
    }),
  },
});

export default function HomePage() {
  return (
    <Chrome>
      <Header banana={123}>YO WADDUP</Header>
      <LiveEditor />
    </Chrome>
  );
}
