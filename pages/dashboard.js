import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'

const REYDEL_LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABQCAIAAADTD63nAAAj/0lEQVR4nO19eXxU1dn/99y5syWZLcskIQlZYBICQQyRsAUBQ8AVxVpReUGp9BULtvq+4Na3rRZbfx9tpdJCXaoSl4LiBkWW1hoSw5KFJYaQEBIyMMlkXyeZfe79/XG8897JTMJiAvg638988pnce5bn3PPc59wLQBBBBBFEEEEEEUQQQQQRxEiDXG0CghgMIvp4wQMcwF81ooL43oIBWEByEWW+F8Lge0Hk/2UQgBEEEgULjAUSgVhABfBAL2ACzgDtQhkJ4Lk69AZxzYP4yqcE4KfAp4AJ4AN9uoD9wEogBMCFZFsQP1AwwpcwYCVQCDgBHrABzcB5oB1wibjKKfpeA9wjNHLNapxrlrD/+4gFlgI3EeIESoDDQD3P9wBOQAKEERJLyGSez+P52wE9AMAFMIKs+iOwDpAEjfogvNACtxKynpAlgHrQPUJAyKArekKeBXoBHnADHkGYbQZwrerEoMS6oiCAipBEoIfnTQAARVhYrE6n1enCwsLkCoWEZQG43W673d5vsbQ2N7d0dAAAw0zguPeAGwAPIAFcgBR4FHhtCFueEMLzV02WBRnrykE809KwsHFxcWNiY9UajVQmo7c4jiOE0JJyuVylUslksvb29q+LikyNjWCYMI7bA8wBPAADcIAdmAiYACJaV3rBMAzH+V++Eggy1pUAZRfKVXq9PiU5OTo6WiaXezwej8fD87xEImEYhmEYb3m5XK5UKlUqVUREhFwu3717d0FBARgmnOPKgSTBQ8ECrwGP+gkthUKhUCh6enokEonHcxVcE0HGGnV4BVV0dLTBYNDr9QDcbjcAqVQqkUg4jnM6nXa73e12cxzHsqxarY6KitLpdDKZTCKRaDSamJiYd999d8+ePWCY+Rz3FcAJk9cPjAPaASJY8ZRH169ff/DgwaKioqsit4KMNYrwspRGo0lPT4+NjQXgcrlYlmVZ1uVydXd3t7W1dXZ2WiwWh8PhVZQymUyr1RoMhunTp48fPx5ASEhIVFTU008/fbKykmeYTzluiSCiJMBKYCvAAm4AggZMSkp66aWXPvjgg507d1553goy1miBcpVEIklLSxs3bhzLsk6nk2VZqVRqsVhMJlNjY2NfX9/wjcjl8ry8vHvvvVcmk0VERNTU1Dz+i19wPD+D5w8BHMABEmA78ICvNqTK9K677rrjjjtef/31Ky+32CvW0w8NPM9HRERMmTJFp9M5HA63261UKnt7e+vr600mk8vlosXE5pcYhBBCiMPh2L17d0tLy69+9Sun05mamnr99dcfPXishGEqOW6yoBAzAYZa9ITQmgzDuN3u+fPnnz9/3mq1MgwjkUgIIRzHXZmlInPhIkFcCojghUpLS8vJyVGr1TabTSqV8jxfWVlZUFBw9uxZl8tF+QYAz/MBZ5ouEgGwLFteXr5x40aWZd1u96zZswFwwF5aDAAQD0QCADie5zjO4/G4XC632/3888/eeOONU6ZM4TjO5XLRhcLoPwMgyFgjC6r+5HL5zJkzMzIy6KJPoVCYzeYDBw6cPn3a7XYPz0/+cLvdLMseOHBg9+7dEokkMTFRLpWC4w4JBTggFIgCQMiYmJi4uLi5c+c+//zz4eHhycnJr7zyytKlSw0Gw5o1a/Lz89PT0wkhEsmoe1WDqnAkwfO8RqOZNm2aSqWy2WwymcztdhcXFxuNRghs9xoyy+FwOIRs27bthhtum6mSlJSUlJSkpqRMn06nNTU1NTY2NjY+PiYmJiYmbZs2DFxcfCciIiIiIiI3bt27Nyb27t3b293d3d3dLd9fX1+fn5+fn5+fn5+fn5+fn5+fn5+fn1+/f39/f3//v39/f39/f39/f39/f39/f39/f39/v39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f3x/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f3+/f39/f39/f39/f3+/f39/f39/f39/f39/f3+/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39="

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const pct = (n) => `${n > 0 ? '+' : ''}${n.toFixed(1)}%`

const THEMES = {
  default: {
    sidebarBg: '#0D0D0D', sidebarBorder: '#1a1a1a', accent: '#C9A84C',
    accentLight: '#E8D5A3', activeNav: '#1a1a1a', pageBg: '#F7F4EF',
    cardBg: '#fff', chartColor: '#C9A84C', positiveColor: '#2D6A4F', negativeColor: '#C0392B',
  },
  reydel: {
    sidebarBg: '#1A1A1A', sidebarBorder: '#2A2A2A', accent: '#CC2222',
    accentLight: '#FF6B6B', activeNav: '#2A2A2A', pageBg: '#F5F5F5',
    cardBg: '#fff', chartColor: '#CC2222', positiveColor: '#2D6A4F', negativeColor: '#CC2222',
    tirePattern: true,
  },
}

const getTheme = (clientName) => {
  if (!clientName) return THEMES.default
  const name = clientName.toLowerCase()
  if (name.includes('reydel') || name.includes('tire')) return THEMES.reydel
  return THEMES.default
}

const CustomTooltip = ({ active, payload, label, theme }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: `1px solid ${theme?.accent || '#C9A84C'}`,
      borderRadius: '2px', padding: '10px 14px', fontSize: '12px',
      fontFamily: 'DM Mono, monospace', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
      <div style={{ color: '#718096', marginBottom: '6px' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: '2px' }}>
          {p.name}: {fmt(p.value)}
        </div>
      ))}
    </div>
  )
}

// ── AI Chat Component ─────────────────────────────────────────────
const AIChat = ({ clientName, monthlyData, topItems, theme }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: `Hi! I'm your financial assistant for ${clientName}. Ask me anything about your numbers — "which tire sold most?", "why did revenue drop?", "what's my best month?" — I'll find the answer in your real data.` }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const ask = async () => {
    if (!input.trim() || loading) return
    const question = input.trim()
    setInput('')
    setMessages(m => [...m, { role: 'user', text: question }])
    setLoading(true)

    try {
      const context = `
You are a financial assistant for ${clientName}, a tire shop. Here is their real financial data:

MONTHLY P&L (Jan-May 2026):
${monthlyData.map(m => `${m.month}: Revenue $${m.revenue.toLocaleString()}, Expenses $${m.expenses.toLocaleString()}, Profit $${m.profit.toLocaleString()} (${((m.profit/m.revenue)*100).toFixed(1)}% margin)`).join('\n')}

TOP SELLING ITEMS (by revenue):
${topItems.slice(0, 15).map(i => `${i.item_name}: ${i.orders} orders, $${Number(i.revenue).toLocaleString()} revenue`).join('\n')}

Answer the question in plain English, be specific and use the actual numbers. Keep it conversational and helpful. If asked about trends, compare the months. If asked about top sellers, reference the item data.`

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: context,
          messages: [{ role: 'user', content: question }]
        })
      })
      const data = await res.json()
      const answer = data.content?.[0]?.text || 'Sorry, I could not get an answer right now.'
      setMessages(m => [...m, { role: 'assistant', text: answer }])
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', text: 'Something went wrong. Please try again.' }])
    }
    setLoading(false)
  }

  return (
    <div style={{ background: theme.cardBg, borderRadius: '4px', border: '1px solid #e2e8f0',
      display: 'flex', flexDirection: 'column', height: '420px' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.accent }} />
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.1em',
          textTransform: 'uppercase', color: '#718096' }}>AI Financial Assistant</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%', padding: '10px 14px', borderRadius: '4px', fontSize: '13px', lineHeight: '1.5',
              background: m.role === 'user' ? theme.accent : '#F7F9FC',
              color: m.role === 'user' ? '#fff' : '#2d3748',
              fontFamily: 'system-ui, sans-serif'
            }}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: '4px', padding: '10px 14px' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%',
                background: theme.accent, animation: `bounce 1s ${i*0.2}s infinite` }} />
            ))}
          </div>
        )}
      </div>
      <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ask()}
          placeholder="Ask about your finances..."
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '4px',
            fontSize: '13px', fontFamily: 'system-ui', outline: 'none' }}
        />
        <button onClick={ask} disabled={loading || !input.trim()}
          style={{ padding: '8px 16px', background: theme.accent, color: '#fff', border: 'none',
            borderRadius: '4px', fontSize: '13px', cursor: 'pointer', fontWeight: '600',
            opacity: loading || !input.trim() ? 0.5 : 1 }}>
          Ask
        </button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [client, setClient] = useState(null)
  const [monthlyData, setMonthlyData] = useState([])
  const [topItems, setTopItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeNav, setActiveNav] = useState('overview')
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Load client info
      const { data: clientData } = await supabase
        .from('clients').select('*').eq('email', user.email).single()
      setClient(clientData)

      // Load monthly summary from real data
      const { data: summary } = await supabase
        .from('monthly_summary')
        .select('*')
        .eq('client_id', clientData?.id)
        .order('month')

      if (summary?.length) {
        const monthNames = { '01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'May',
          '06':'Jun','07':'Jul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec' }
        setMonthlyData(summary.map(r => ({
          month: monthNames[r.month.split('-')[1]] || r.month,
          revenue: Number(r.revenue),
          expenses: Number(r.expenses) + Number(r.cogs || 0),
          profit: Number(r.profit),
          cogs: Number(r.cogs || 0),
          gross_profit: Number(r.gross_profit || 0),
        })))
      }

      // Load top selling items from Clover
      const { data: items } = await supabase
        .from('clover_line_items')
        .select('item_name, revenue')
        .eq('client_id', clientData?.id)

      if (items?.length) {
        const grouped = {}
        items.forEach(i => {
          if (!grouped[i.item_name]) grouped[i.item_name] = { item_name: i.item_name, orders: 0, revenue: 0 }
          grouped[i.item_name].orders++
          grouped[i.item_name].revenue += Number(i.revenue)
        })
        const sorted = Object.values(grouped).sort((a, b) => b.revenue - a.revenue)
        setTopItems(sorted)
      }

      setLoading(false)
    }
    init()
  }, [])

  const theme = getTheme(client?.name)

  const totalRevenue = monthlyData.reduce((s, m) => s + m.revenue, 0)
  const totalProfit = monthlyData.reduce((s, m) => s + m.profit, 0)
  const totalExpenses = monthlyData.reduce((s, m) => s + m.expenses, 0)
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
  const lastMonth = monthlyData[monthlyData.length - 1]
  const prevMonth = monthlyData[monthlyData.length - 2]
  const revenueChange = prevMonth ? ((lastMonth?.revenue - prevMonth.revenue) / prevMonth.revenue) * 100 : 0

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'financials', label: 'Financials' },
    { id: 'inventory', label: 'Sales & Items' },
    { id: 'ai', label: '✦ Ask AI' },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#F5F5F5', fontFamily: 'system-ui' }}>
      <div style={{ color: '#718096', fontSize: '14px' }}>Loading your dashboard...</div>
    </div>
  )

  const Sidebar = () => (
    <div style={{ width: isMobile ? '100%' : '220px', background: theme.sidebarBg,
      display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0 }}>
      <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${theme.sidebarBorder}` }}>
        <img src={REYDEL_LOGO} alt={client?.name}
          style={{ width: '160px', height: 'auto', display: 'block' }} />
      </div>
      <nav style={{ flex: 1, padding: '16px 0' }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => { setActiveNav(item.id); setSidebarOpen(false) }}
            style={{ display: 'block', width: '100%', padding: '10px 20px', textAlign: 'left',
              background: activeNav === item.id ? theme.activeNav : 'transparent',
              color: activeNav === item.id ? '#fff' : '#a0aec0',
              border: 'none', cursor: 'pointer', fontSize: '13px',
              fontFamily: 'DM Mono, monospace', letterSpacing: '0.05em',
              borderLeft: activeNav === item.id ? `2px solid ${theme.accent}` : '2px solid transparent',
            }}>
            {item.label}
          </button>
        ))}
      </nav>
      <div style={{ padding: '16px 20px', borderTop: `1px solid ${theme.sidebarBorder}` }}>
        <div style={{ color: '#718096', fontSize: '11px', marginBottom: '4px',
          fontFamily: 'DM Mono, monospace' }}>{client?.name}</div>
        <button onClick={handleLogout}
          style={{ color: '#718096', fontSize: '11px', background: 'none', border: 'none',
            cursor: 'pointer', fontFamily: 'DM Mono, monospace', padding: 0 }}>
          Sign out →
        </button>
      </div>
    </div>
  )

  return (
    <>
      <Head>
        <title>{client?.name} — Financial Dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }
          @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }`}</style>
      </Head>

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {!isMobile && <Sidebar />}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          background: theme.pageBg }}>

          {/* Mobile header */}
          {isMobile && (
            <div style={{ background: theme.sidebarBg, padding: '12px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <img src={REYDEL_LOGO} alt={client?.name} style={{ width: '120px', height: 'auto' }} />
              <button onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>
                {sidebarOpen ? '✕' : '☰'}
              </button>
            </div>
          )}

          {isMobile && sidebarOpen && (
            <div style={{ position: 'absolute', top: '52px', left: 0, right: 0, zIndex: 100,
              background: theme.sidebarBg }}>
              <Sidebar />
            </div>
          )}

          {/* Main content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '28px 32px' }}>

            {/* Page header */}
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700',
                color: '#1a202c', marginBottom: '4px' }}>
                {activeNav === 'overview' && 'Financial Overview'}
                {activeNav === 'financials' && 'Profit & Loss'}
                {activeNav === 'inventory' && 'Sales & Items'}
                {activeNav === 'ai' && 'AI Financial Assistant'}
              </h1>
              <div style={{ color: '#718096', fontSize: '13px', fontFamily: 'DM Mono, monospace' }}>
                Jan – May 2026 • Live Data
              </div>
            </div>

            {/* OVERVIEW TAB */}
            {activeNav === 'overview' && (
              <>
                {/* KPI cards */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
                  gap: '16px', marginBottom: '24px' }}>
                  {[
                    { label: 'Total Revenue', value: fmt(totalRevenue), sub: `${revenueChange > 0 ? '+' : ''}${revenueChange.toFixed(1)}% last mo`, color: theme.accent },
                    { label: 'Net Profit', value: fmt(totalProfit), sub: `${avgMargin.toFixed(1)}% margin`, color: '#2D6A4F' },
                    { label: 'Total Expenses', value: fmt(totalExpenses), sub: 'incl. COGS', color: '#718096' },
                    { label: 'Best Month', value: lastMonth?.month || '-',
                      sub: lastMonth ? fmt(lastMonth.revenue) : '-', color: theme.accent },
                  ].map((card, i) => (
                    <div key={i} style={{ background: theme.cardBg, borderRadius: '4px',
                      padding: '20px', border: '1px solid #e2e8f0',
                      borderTop: `3px solid ${card.color}` }}>
                      <div style={{ fontSize: '11px', color: '#718096', fontFamily: 'DM Mono, monospace',
                        letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                        {card.label}
                      </div>
                      <div style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: '700', color: '#1a202c', marginBottom: '4px' }}>
                        {card.value}
                      </div>
                      <div style={{ fontSize: '11px', color: card.color, fontFamily: 'DM Mono, monospace' }}>
                        {card.sub}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Revenue chart */}
                <div style={{ background: theme.cardBg, borderRadius: '4px', padding: '20px',
                  border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                  <div style={{ fontSize: '11px', color: '#718096', fontFamily: 'DM Mono, monospace',
                    letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
                    Revenue vs Profit
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.accent} stopOpacity={0.15}/>
                          <stop offset="95%" stopColor={theme.accent} stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'DM Mono, monospace' }} />
                      <YAxis tick={{ fontSize: 11, fontFamily: 'DM Mono, monospace' }}
                        tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip theme={theme} />} />
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke={theme.accent}
                        fill="url(#revGrad)" strokeWidth={2} dot={{ r: 3 }} />
                      <Area type="monotone" dataKey="profit" name="Profit" stroke="#2D6A4F"
                        fill="url(#profGrad)" strokeWidth={2} dot={{ r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Top 5 items */}
                <div style={{ background: theme.cardBg, borderRadius: '4px', padding: '20px',
                  border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#718096', fontFamily: 'DM Mono, monospace',
                    letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
                    Top Selling Items
                  </div>
                  {topItems.slice(0, 5).map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 0', borderBottom: i < 4 ? '1px solid #f0f0f0' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%',
                          background: theme.accent, color: '#fff', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '10px', fontWeight: '700',
                          fontFamily: 'DM Mono, monospace', flexShrink: 0 }}>
                          {i + 1}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a202c' }}>
                            {item.item_name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#718096', fontFamily: 'DM Mono, monospace' }}>
                            {item.orders} orders
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: theme.accent }}>
                        {fmt(item.revenue)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* FINANCIALS TAB */}
            {activeNav === 'financials' && (
              <>
                <div style={{ background: theme.cardBg, borderRadius: '4px', padding: '20px',
                  border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                  <div style={{ fontSize: '11px', color: '#718096', fontFamily: 'DM Mono, monospace',
                    letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
                    Monthly Breakdown
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={monthlyData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'DM Mono, monospace' }} />
                      <YAxis tick={{ fontSize: 11, fontFamily: 'DM Mono, monospace' }}
                        tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip theme={theme} />} />
                      <Bar dataKey="revenue" name="Revenue" fill={theme.accent} radius={[2,2,0,0]} />
                      <Bar dataKey="expenses" name="Expenses" fill="#e2e8f0" radius={[2,2,0,0]} />
                      <Bar dataKey="profit" name="Profit" fill="#2D6A4F" radius={[2,2,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* P&L Table */}
                <div style={{ background: theme.cardBg, borderRadius: '4px',
                  border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '11px', color: '#718096', fontFamily: 'DM Mono, monospace',
                      letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Profit & Loss Summary
                    </div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#f7fafc' }}>
                          <th style={{ padding: '10px 20px', textAlign: 'left', color: '#718096',
                            fontFamily: 'DM Mono, monospace', fontSize: '11px', fontWeight: '500' }}>Month</th>
                          {['Revenue','Expenses','COGS','Gross Profit','Net Profit','Margin'].map(h => (
                            <th key={h} style={{ padding: '10px 16px', textAlign: 'right', color: '#718096',
                              fontFamily: 'DM Mono, monospace', fontSize: '11px', fontWeight: '500' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyData.map((row, i) => {
                          const margin = row.revenue > 0 ? (row.profit / row.revenue * 100) : 0
                          return (
                            <tr key={i} style={{ borderTop: '1px solid #f0f0f0' }}>
                              <td style={{ padding: '12px 20px', fontWeight: '600', color: '#1a202c' }}>{row.month}</td>
                              <td style={{ padding: '12px 16px', textAlign: 'right', color: theme.accent, fontWeight: '600' }}>{fmt(row.revenue)}</td>
                              <td style={{ padding: '12px 16px', textAlign: 'right', color: '#718096' }}>{fmt(row.expenses)}</td>
                              <td style={{ padding: '12px 16px', textAlign: 'right', color: '#718096' }}>{fmt(row.cogs)}</td>
                              <td style={{ padding: '12px 16px', textAlign: 'right', color: '#2D6A4F' }}>{fmt(row.gross_profit)}</td>
                              <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700',
                                color: row.profit >= 0 ? '#2D6A4F' : '#CC2222' }}>{fmt(row.profit)}</td>
                              <td style={{ padding: '12px 16px', textAlign: 'right',
                                color: margin >= 30 ? '#2D6A4F' : margin >= 20 ? '#718096' : '#CC2222',
                                fontFamily: 'DM Mono, monospace', fontSize: '12px' }}>
                                {margin.toFixed(1)}%
                              </td>
                            </tr>
                          )
                        })}
                        <tr style={{ borderTop: '2px solid #e2e8f0', background: '#f7fafc', fontWeight: '700' }}>
                          <td style={{ padding: '12px 20px', color: '#1a202c' }}>TOTAL</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', color: theme.accent }}>{fmt(totalRevenue)}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', color: '#718096' }}>{fmt(totalExpenses)}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', color: '#718096' }}>—</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', color: '#2D6A4F' }}>—</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', color: '#2D6A4F' }}>{fmt(totalProfit)}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', color: '#2D6A4F',
                            fontFamily: 'DM Mono, monospace', fontSize: '12px' }}>{avgMargin.toFixed(1)}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* SALES & ITEMS TAB */}
            {activeNav === 'inventory' && (
              <div style={{ background: theme.cardBg, borderRadius: '4px',
                border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#718096', fontFamily: 'DM Mono, monospace',
                    letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    All Items — Ranked by Revenue
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f7fafc' }}>
                        {['#','Item','Orders','Revenue','Avg Sale'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: h === '#' || h === 'Item' ? 'left' : 'right',
                            color: '#718096', fontFamily: 'DM Mono, monospace', fontSize: '11px', fontWeight: '500' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {topItems.slice(0, 30).map((item, i) => (
                        <tr key={i} style={{ borderTop: '1px solid #f0f0f0',
                          background: i === 0 ? `${theme.accent}08` : 'transparent' }}>
                          <td style={{ padding: '10px 16px', color: '#718096',
                            fontFamily: 'DM Mono, monospace', fontSize: '11px' }}>{i + 1}</td>
                          <td style={{ padding: '10px 16px', fontWeight: i < 3 ? '700' : '500',
                            color: '#1a202c' }}>{item.item_name}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', color: '#718096',
                            fontFamily: 'DM Mono, monospace' }}>{item.orders}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: '600',
                            color: i < 3 ? theme.accent : '#1a202c' }}>{fmt(item.revenue)}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', color: '#718096',
                            fontFamily: 'DM Mono, monospace', fontSize: '12px' }}>
                            {fmt(item.revenue / item.orders)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* AI TAB */}
            {activeNav === 'ai' && (
              <AIChat clientName={client?.name} monthlyData={monthlyData}
                topItems={topItems} theme={theme} />
            )}

          </div>
        </div>
      </div>
    </>
  )
}
