import { ClipboardList, Hourglass, CheckSquare, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

// Props allow you to pass live counts from your app
export default function KPIStepper({
  active = 0,
  assigned = 0,
  completed = 0,
  allActivities = 0,
}: {
  active?: number;
  assigned?: number;
  completed?: number;
  allActivities?: number;
}) {
  const steps = [
    { label: "Active Tasks", value: active, Icon: ClipboardList, color: "text-blue-600" },
    { label: "Assigned", value: assigned, Icon: Hourglass, color: "text-orange-600" },
    { label: "Completed", value: completed, Icon: CheckSquare, color: "text-green-600" },
    { label: "All Activities", value: allActivities, Icon: TrendingUp, color: "text-purple-600" },
  ];

  return (
    <div className="w-full px-4 py-2">
      <div className="relative mx-auto max-w-6xl">
        {/* timeline line */}
        <div className="absolute left-0 right-0 top-5 h-0.5 bg-gray-200" />

        <ul className="relative grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
          {steps.map(({ label, value, Icon, color }, idx) => (
            <li key={label} className="relative flex flex-col items-center text-center">
              {/* node */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                className="z-10 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm"
              >
                <Icon className={`h-4 w-4 ${color}`} aria-hidden="true" />
              </motion.div>

              {/* connector ticks */}
              <div className="absolute top-5 h-1.5 w-0.5 -translate-y-1/2 bg-gray-300" />

              {/* labels */}
              <div className="mt-2 space-y-0.5">
                <div className="text-xs font-medium tracking-wide text-gray-500">{label}</div>
                <div className="text-lg font-extrabold leading-none text-gray-900">{value}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* subtle legend / footer (optional) */}
      <div className="mx-auto mt-2 max-w-6xl text-center text-xs text-gray-400">
        Summary at a glance · updated in real time
      </div>
    </div>
  );
}
