import { h, Component } from 'preact';
import { Block } from 'jsxstyle/preact';

interface ProfileProps {
  user?: string;
}

interface ProfileState {
  time: number;
  count: number;
}

export default class Profile extends Component<ProfileProps, ProfileState> {
  state = {
    time: Date.now(),
    count: 10,
  };

  private timer: NodeJS.Timer;

  // gets called when this route is navigated to
  componentDidMount() {
    // start a timer for the clock:
    this.timer = global.setInterval(this.updateTime, 1000);
  }

  // gets called just before navigating away from the route
  componentWillUnmount() {
    global.clearInterval(this.timer);
  }

  // update the current time
  private updateTime = () => {
    this.setState({ time: Date.now() });
  };

  private increment = () => {
    this.setState({ count: this.state.count + 1 });
  };

  // Note: `user` comes from the URL, courtesy of our router
  render({ user }: ProfileProps, { time, count }: ProfileState) {
    return (
      <Block padding="56px 20px" minHeight="100%" width="100%">
        <h1>Profile: {user}</h1>
        <p>This is the user profile for a user named {user}.</p>

        <div>Current time: {new Date(time).toLocaleString()}</div>

        <p>
          <button onClick={this.increment}>Click Me</button> Clicked {count}{' '}
          times.
        </p>
      </Block>
    );
  }
}
