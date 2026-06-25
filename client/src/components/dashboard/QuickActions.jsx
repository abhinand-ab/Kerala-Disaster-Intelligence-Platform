import Card from "../common/Card";
import Button from "../common/Button";

const QuickActions = () => {
  return (
    <Card>

      <h2 className="font-semibold mb-4">
        Quick Actions
      </h2>

      <div className="space-y-3">

        <Button>
          Report Incident
        </Button>

        <Button>
          Locate Shelter
        </Button>

      </div>

    </Card>
  );
};

export default QuickActions;